// ─── Dashboard UI for Jump-King AI Trainer ───────────────────────────
// Panel 1: Training Controls — play/pause, speed, reset, replay, mode
// Integrates with global state from sketch.js


let dash = null;        // Dashboard instance, created in setup()


class Dashboard {

    constructor() {
        this.visible = true;
        this.pw = 260;                     // panel width
        this.px = width - this.pw;         // panel X (right side)

        // ── Colours ──────────────────────────────────────────────
        const C = this._col = {
            bg:          color(18, 18, 30, 235),
            border:      color(55, 55, 80),
            accent:      color(80, 160, 255),
            text:        color(225, 225, 240),
            dim:         color(140, 140, 175),
            btn:         color(45, 45, 65),
            btnHov:      color(60, 60, 85),
            btnActive:   color(80, 160, 255),
            track:       color(50, 50, 70),
            thumb:       color(80, 160, 255),
            green:       color(70, 200, 90),
            red:         color(220, 70, 70),
            yellow:      color(255, 200, 50),
        };

        // ── Panel layout ─────────────────────────────────────────
        this.tabNames = ['controls', 'params', 'charts'];
        this.activeTab = 'controls';

        // Tabs bar Y
        this._tabY = 45;

        // ── SECTION: Training Controls ───────────────────────────
        this._playBtn  = { x: this.px + 10, y: 72, w: 70, h: 26, label: '▶',       toggled: false };
        this._resetBtn = { x: this.px + 90, y: 72, w: 70, h: 26, label: 'Reset' };
        this._replayBtn= { x: this.px + 170,y: 72, w: 80, h: 26, label: 'Replay' };

        // Speed slider
        this._speedS = { x: this.px + 10, y: 120, w: 240, h: 14,
                         min: 1, max: 200, val: evolationSpeed, drag: false };

        // Mode switch (Human / AI / Observe)
        this._mode = { x: this.px + 10, y: 155, w: 240, h: 22,
                       opts: ['▶Human','▶AI'], cur: testingSinglePlayer ? 0 : 1 };

        // ── SECTION: Live Stats ──────────────────────────────────
        this._statsY = 195;

        // ── Pause state ──────────────────────────────────────────
        this.paused = false;

        // ── Chart data ───────────────────────────────────────────
        this.genHistory = [];          // [{gen, height, level, fitness}]
        this._lastGenRecorded = -1;
    }


    // ═══════════════════════════════════════════════════════════════
    //  DRAW
    // ═══════════════════════════════════════════════════════════════

    draw() {
        if (!this.visible) return;

        push();
        noStroke();

        // ── Panel background ─────────────────────────────────────
        fill(this._col.bg);
        rect(this.px, 0, this.pw, height);
        stroke(this._col.border);
        strokeWeight(1);
        line(this.px, 0, this.px, height);
        noStroke();

        // ── Title ────────────────────────────────────────────────
        fill(this._col.accent);
        textAlign(LEFT, TOP);
        textSize(12);
        textFont('Courier');
        text('⌘ TRAINING DASHBOARD', this.px + 12, 8);
        stroke(this._col.border);
        line(this.px + 8, 28, width - 8, 28);
        noStroke();

        // ── Tab bar ──────────────────────────────────────────────
        this._drawTabs();
        pop();

        // ── Panels ───────────────────────────────────────────────
        push();
        noStroke();
        if (this.activeTab === 'controls') {
            this._drawControls();
            this._drawLiveStats();
        } else if (this.activeTab === 'params') {
            this._drawParams();
        } else if (this.activeTab === 'charts') {
            this._drawChart();
        }
        pop();
    }


    // ── Tabs ──────────────────────────────────────────────────────

    _drawTabs() {
        let names = ['Controls', 'Params', 'Charts'];
        let tabW = this.pw / names.length;
        textSize(10);
        textFont('Courier');
        textAlign(CENTER, TOP);

        for (let i = 0; i < names.length; i++) {
            let tx = this.px + i * tabW;
            let active = this.tabNames[i] === this.activeTab;

            if (active) {
                fill(this._col.accent);
                rect(tx, this._tabY, tabW, 22);
                fill(18, 18, 30);
            } else {
                let hover = this._isOver(tx, this._tabY, tabW, 22);
                fill(hover ? this._col.btnHov : this._col.btn);
                rect(tx, this._tabY, tabW, 22);
                fill(this._col.dim);
            }
            text(names[i], tx + tabW / 2, this._tabY + 5);
        }
    }


    // ── Controls section ──────────────────────────────────────────

    _drawControls() {
        // Row 1: Play / Reset / Replay
        this._drawBtn(this._playBtn);
        this._drawBtn(this._resetBtn);
        this._drawBtn(this._replayBtn);

        // Speed slider
        this._drawSlider(this._speedS, 'Sim Speed', '');

        // Mode toggle
        this._drawToggle(this._mode);
    }


    // ── Live stats ────────────────────────────────────────────────

    _drawLiveStats() {
        if (testingSinglePlayer && !population) {
            this._drawStatLine(null, 'Human Play', this._col.yellow, this._statsY);
            this._drawStatLine('Tip:', 'Set mode to AI', this._col.dim, this._statsY + 16);
            return;
        }

        // Sync slider from global
        this._speedS.val = evolationSpeed;

        let pop = population;
        if (!pop || pop.players.length === 0) return;

        let best  = pop.players[pop.bestPlayerIndex];
        let alive = pop.players.filter(p => !p.hasFinishedInstructions).length;

        let y = this._statsY;
        this._drawStatLine('Generation', pop.gen, this._col.text, y);          y += 18;
        this._drawStatLine('Best Level', pop.currentBestLevelReached + '/43', this._col.text, y); y += 18;
        this._drawStatLine('Best Height', pop.bestHeight, this._col.text, y);    y += 18;
        this._drawStatLine('Actions', best.brain.instructions.length, this._col.text, y); y += 18;
        this._drawStatLine('Alive', alive + '/' + pop.players.length, alive > 0 ? this._col.green : this._col.red, y); y += 18;
        this._drawStatLine('FPS', floor(getFrameRate()), this._col.text, y);    y += 18;
        this._drawStatLine('Speed', '×' + evolationSpeed, this._col.text, y);   y += 18;

        // Best Fitness
        let bf = floor(best.fitness);
        this._drawStatLine('Best Fit', bf.toLocaleString(), this._col.accent, y); y += 18;

        // Recording chart data
        if (!testingSinglePlayer && pop.gen !== this._lastGenRecorded) {
            this.genHistory.push({
                gen: pop.gen,
                height: pop.bestHeight,
                level: pop.currentBestLevelReached,
                fitness: bf,
            });
            this._lastGenRecorded = pop.gen;
        }
    }


    _drawStatLine(label, value, valCol, y) {
        fill(this._col.dim);
        textAlign(LEFT, TOP);
        textSize(10);
        textFont('Courier');
        text(label, this.px + 12, y);
        fill(valCol);
        text(value, this.px + 12, y + 11);
    }


    // ── Params tab (placeholder for now) ──────────────────────────

    _drawParams() {
        fill(this._col.dim);
        textAlign(LEFT, TOP);
        textSize(10);
        textFont('Courier');
        text('Parameter adjustments coming soon.', this.px + 12, this._statsY);
    }


    // ── Charts tab (placeholder for now) ──────────────────────────

    _drawChart() {
        if (this.genHistory.length < 2) {
            fill(this._col.dim);
            textAlign(CENTER, CENTER);
            textSize(10);
            textFont('Courier');
            text('Run AI training to collect data...',
                  this.px + this.pw / 2, this._statsY + 40);
            return;
        }

        // Simple line chart for fitness
        let cx = this.px + 15;
        let cy = this._statsY + 5;
        let cw = this.pw - 30;
        let ch = 220;

        // Background
        fill(12, 12, 20, 200);
        rect(cx, cy, cw, ch);

        // Title
        fill(this._col.accent);
        textAlign(LEFT, TOP);
        textSize(10);
        text('FITNESS OVER GENERATIONS', cx + 4, cy + 3);

        // Find max fitness for scaling
        let maxF = 0;
        for (let d of this.genHistory) if (d.fitness > maxF) maxF = d.fitness;
        if (maxF === 0) maxF = 1;

        // Draw line
        let margin = 20;
        let plotY = cy + ch - margin;
        let plotH = ch - margin * 2 - 15;
        let plotW = cw - margin * 2 - 5;
        let startX = cx + margin;

        stroke(this._col.accent);
        strokeWeight(1.5);
        noFill();

        beginShape();
        for (let i = 0; i < this.genHistory.length; i++) {
            let d = this.genHistory[i];
            let x = startX + (i / max(1, this.genHistory.length - 1)) * plotW;
            let y = plotY - (d.fitness / maxF) * plotH;
            vertex(x, y);
        }
        endShape();

        // Current fitness label
        let last = this.genHistory[this.genHistory.length - 1];
        fill(this._col.accent);
        textAlign(RIGHT, TOP);
        textSize(9);
        text(last.fitness.toLocaleString(), cx + cw - 4, cy + 16);

        // Generation label
        fill(this._col.dim);
        textAlign(LEFT, TOP);
        textSize(9);
        text('Gen ' + last.gen, startX, plotY + 6);
        text(last.gen, startX + plotW - 20, plotY + 6);
    }


    // ═══════════════════════════════════════════════════════════════
    //  UI COMPONENTS
    // ═══════════════════════════════════════════════════════════════

    _drawBtn(b) {
        let hover = this._isOver(b.x, b.y, b.w, b.h);
        fill(b.toggled ? this._col.btnActive : (hover ? this._col.btnHov : this._col.btn));
        rect(b.x, b.y, b.w, b.h, 4);
        fill(b.toggled ? color(18, 18, 30) : this._col.text);
        textAlign(CENTER, CENTER);
        textSize(11);
        textFont('Courier');
        text(b.label, b.x + b.w / 2, b.y + b.h / 2);
    }


    _drawSlider(s, label, suffix) {
        fill(this._col.dim);
        textAlign(LEFT, TOP);
        textSize(10);
        textFont('Courier');
        text(label + ': ' + s.val + suffix, s.x, s.y - 14);
        fill(this._col.track);
        rect(s.x, s.y + 2, s.w, 10, 5);
        let tx = map(s.val, s.min, s.max, s.x + 5, s.x + s.w - 5);
        fill(this._col.thumb);
        ellipse(tx, s.y + 7, 13, 13);
    }


    _drawToggle(t) {
        // Label
        fill(this._col.dim);
        textAlign(LEFT, CENTER);
        textSize(10);
        textFont('Courier');
        text('Mode:', t.x, t.y + t.h / 2);

        let labelW = 38;
        let btnW = (t.w - labelW - 6) / t.opts.length;

        for (let i = 0; i < t.opts.length; i++) {
            let bx = t.x + labelW + 3 + i * (btnW + 3);
            let isCur = i === t.cur;
            fill(isCur ? this._col.btnActive : (this._isOver(bx, t.y, btnW, t.h) ? this._col.btnHov : this._col.btn));
            rect(bx, t.y, btnW, t.h, 4);
            fill(isCur ? color(18, 18, 30) : this._col.text);
            textAlign(CENTER, CENTER);
            textSize(10);
            text(t.opts[i], bx + btnW / 2, t.y + t.h / 2);
        }
    }


    // ═══════════════════════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════════════════════

    handleClick() {
        if (!this.visible) return false;

        // Tabs
        let tabW = this.pw / this.tabNames.length;
        for (let i = 0; i < this.tabNames.length; i++) {
            let tx = this.px + i * tabW;
            if (this._isOver(tx, this._tabY, tabW, 22)) {
                this.activeTab = this.tabNames[i];
                return true;
            }
        }

        if (this.activeTab !== 'controls') return false;

        // Play button
        if (this._isOverB(this._playBtn)) {
            this._playBtn.toggled = !this._playBtn.toggled;
            this._playBtn.label = this._playBtn.toggled ? '⏸' : '▶';
            this._togglePause(this._playBtn.toggled);
            return true;
        }

        // Reset
        if (this._isOverB(this._resetBtn)) {
            this._resetPopulation();
            return true;
        }

        // Replay
        if (this._isOverB(this._replayBtn)) {
            this._replayBest();
            return true;
        }

        // Mode toggle
        let t = this._mode;
        let labelW = 38;
        let btnW = (t.w - labelW - 6) / t.opts.length;
        for (let i = 0; i < t.opts.length; i++) {
            let bx = t.x + labelW + 3 + i * (btnW + 3);
            if (this._isOver(bx, t.y, btnW, t.h)) {
                t.cur = i;
                this._switchMode(i);
                return true;
            }
        }

        // Speed slider drag start
        let s = this._speedS;
        if (this._isOver(s.x, s.y - 6, s.w, s.h + 16)) {
            s.drag = true;
            this._updateSlider(s);
            return true;
        }

        return false;
    }


    handleMouseReleased() {
        this._speedS.drag = false;
    }


    handleMouseDragged() {
        if (this._speedS.drag) this._updateSlider(this._speedS);
    }


    handleKey(key, keyCode) {
        if (key === 'D' || key === 'd') {
            this.visible = !this.visible;
            return true;
        }
        return false;
    }


    // ═══════════════════════════════════════════════════════════════
    //  ACTIONS (modify global state)
    // ═══════════════════════════════════════════════════════════════

    _togglePause(state) {
        this.paused = state;
    }


    _resetPopulation() {
        if (population) {
            population.ResetAllPlayers();
            // Reset chart data
            this.genHistory = [];
            this._lastGenRecorded = -1;
        }
    }


    _replayBest() {
        if (testingSinglePlayer) return;
        if (population && population.cloneOfBestPlayerFromPreviousGeneration) {
            replayingBestPlayer = true;
            cloneOfBestPlayer = population.cloneOfBestPlayerFromPreviousGeneration.clone();
            evolationSpeed = 1;
            mutePlayers = false;
            // Update slider to match
            this._speedS.val = 1;
        }
    }


    _switchMode(index) {
        if (index === 0) {
            // Human mode
            testingSinglePlayer = true;
            this._playBtn.toggled = false;
            this._playBtn.label = '▶';
            this.paused = false;
        } else {
            // AI training mode
            testingSinglePlayer = false;
            if (!population || population.players.length === 0) {
                population = new Population(600);
            }
        }
    }


    _updateSlider(s) {
        let v = map(mouseX, s.x, s.x + s.w, s.min, s.max);
        s.val = floor(constrain(v, s.min, s.max));
        if (s === this._speedS) evolationSpeed = s.val;
    }


    // ═══════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════

    _isOver(x, y, w, h) {
        return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
    }

    _isOverB(b) {
        return this._isOver(b.x, b.y, b.w, b.h);
    }
}


// ═══════════════════════════════════════════════════════════════════
//  GLOBAL INTEGRATION HELPERS (called from sketch.js)
// ═══════════════════════════════════════════════════════════════════

function setupDashboard() {
    dash = new Dashboard();
}

function drawDashboard() {
    if (dash) dash.draw();
}

function handleDashboardClick() {
    if (dash) return dash.handleClick();
    return false;
}

function handleDashboardMouseReleased() {
    if (dash) dash.handleMouseReleased();
}

function handleDashboardMouseDragged() {
    if (dash) dash.handleMouseDragged();
}

function handleDashboardKey(key, keyCode) {
    if (dash) return dash.handleKey(key, keyCode);
    return false;
}
