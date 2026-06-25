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

        // Save / Load buttons
        this._saveBtn = { x: this.px + 10, y: 186, w: 115, h: 22, label: '💾 Save Brain' };
        this._loadBtn = { x: this.px + 135, y: 186, w: 115, h: 22, label: '📂 Load Brain' };

        // ── Section: Live Stats ──────────────────────────────────
        this._statsY = 220;

        // ── Section: Parameters ──────────────────────────────────
        this._params = [
            // Population section
            { key: 'popSize',     label: 'Population',  min: 50,  max: 2000, step: 50,
              val: populationSize, note: '↻ reset to apply', section: 'POPULATION',
              apply: (v) => { populationSize = v; } },
            { key: 'startMoves',  label: 'Start Moves',  min: 1,   max: 100,  step: 1,
              val: startingPlayerActions, note: '↻ reset to apply', section: 'POPULATION',
              apply: (v) => { startingPlayerActions = v; } },

            // Evolution section
            { key: 'mutRate',     label: 'Mutation Rate', min: 0,   max: 0.5, step: 0.01,
              val: mutationRate,  note: '', section: 'EVOLUTION',
              apply: (v) => { mutationRate = v; } },
            { key: 'newInstr',    label: 'New Action',    min: 0,   max: 0.2, step: 0.01,
              val: chanceOfNewInstruction, note: 'chance per action', section: 'EVOLUTION',
              apply: (v) => { chanceOfNewInstruction = v; } },
            { key: 'addActions',  label: '+Actions/gen',  min: 1,   max: 20,  step: 1,
              val: increaseActionsByAmount,  note: '', section: 'EVOLUTION',
              apply: (v) => { increaseActionsByAmount = v; } },
            { key: 'addEvery',    label: 'Every N gen',   min: 1,   max: 50,  step: 1,
              val: increaseActionsEveryXGenerations, note: '', section: 'EVOLUTION',
              apply: (v) => { increaseActionsEveryXGenerations = v; } },
            { key: 'elitePct',    label: 'Elite %',       min: 0.01,max: 0.20,step: 0.01,
              val: elitePercent,  note: 'top % kept intact', section: 'EVOLUTION',
              apply: (v) => { elitePercent = v; } },
            { key: 'adaptMut',    label: 'Adaptive Mut',  min: 0,   max: 1,   step: 1,
              val: adaptiveMutate ? 1 : 0, note: 'boost mutation on stagnation', section: 'EVOLUTION',
              apply: (v) => { adaptiveMutate = v >= 0.5; } },

            // Selection section
            { key: 'tournSize',   label: 'Tournament',    min: 0,   max: 10,  step: 1,
              val: tournamentSize, note: '0=roulette, 2+=tournament', section: 'SELECTION',
              apply: (v) => { tournamentSize = v; } },
            { key: 'crossRate',   label: 'Crossover',     min: 0,   max: 1,   step: 0.05,
              val: crossoverRate, note: 'probability vs clone', section: 'SELECTION',
              apply: (v) => { crossoverRate = v; } },
            { key: 'rankFit',     label: 'Rank Fitness',  min: 0,   max: 1,   step: 1,
              val: useRankFitness ? 1 : 0, note: 'rank-based instead of raw', section: 'SELECTION',
              apply: (v) => { useRankFitness = v >= 0.5; } },
            { key: 'killBad',     label: 'Kill Weak',     min: 0,   max: 1,   step: 1,
              val: killBadPlayers ? 1 : 0, note: 'kill players below best level', section: 'SELECTION',
              apply: (v) => { killBadPlayers = v >= 0.5; } },

            // Stagnation section
            { key: 'stagLimit',   label: 'Stag. Limit',   min: 30,  max: 500, step: 10,
              val: stagnationLimit, note: 'gen → diversity restart', section: 'STAGNATION',
              apply: (v) => { stagnationLimit = v; } },

            // AI Behaviour section
            { key: 'jumpChance',  label: 'Jump Chance',   min: 0,   max: 1,   step: 0.05,
              val: window.jumpChance !== undefined ? window.jumpChance : 0.5, note: '',
              section: 'BEHAVIOUR',
              apply: (v) => { jumpChance = v; } },
            { key: 'fullJump',    label: 'Full Jump %',   min: 0,   max: 1,   step: 0.05,
              val: window.chanceOfFullJump !== undefined ? window.chanceOfFullJump : 0.2, note: '',
              section: 'BEHAVIOUR',
              apply: (v) => { chanceOfFullJump = v; } },
        ];
        this._paramsY = this._statsY;  // start Y for params content
        this._paramDragIdx = -1;       // which param is being dragged (-1 = none)
        this._paramsScrollY = 0;       // scroll offset for params
        this._paramsContentH = 0;      // total content height (for scroll bounds)
        this._paramsViewH = height - this._tabY - 25; // visible area

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

        // ── Save / Load ─────────────────────────────────────────
        this._drawBtn(this._saveBtn);
        this._drawBtn(this._loadBtn);
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
        this._drawStatLine('FPS', floor(frameRate()), this._col.text, y);    y += 18;
        this._drawStatLine('Speed', '×' + evolationSpeed, this._col.text, y);   y += 18;

        // Best Fitness
        let bf = floor(best.fitness);
        this._drawStatLine('Best Fit', bf.toLocaleString(), this._col.accent, y); y += 18;

        // Stagnation
        let stagColor = pop.gensSinceNewLevel > stagnationLimit * 0.7 ? this._col.red : this._col.text;
        this._drawStatLine('Stagnation', pop.gensSinceNewLevel + ' gen', stagColor, y); y += 18;

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


    // ── Params tab ──────────────────────────────────────────────

    _drawParams() {
        let px = this.px;
        let cx = px + 12;           // content start X
        let cw = this.pw - 24;      // content width

        // ── Start right below tabs ──────────────────────────────
        let startY = this._tabY + 25;
        let y = startY - this._paramsScrollY;
        let clipH = height - startY - 10;

        // ── Clip to visible content area ─────────────────────────
        push();
        clip(mouseX < px + this.pw ? cx : 0, startY, cw, clipH);

        // ── Section loop ─────────────────────────────────────────
        let currentSection = '';
        let paramIdx = 0;
        let firstY = y;

        for (let p of this._params) {
            // ── Section header ──────────────────────────────────
            if (p.section !== currentSection) {
                currentSection = p.section;
                fill(this._col.accent);
                textAlign(LEFT, TOP);
                textSize(9);
                textFont('Courier');
                text('── ' + currentSection + ' ──', cx, y);
                y += 20;
            }

            // ── Label + Value row ─────────────────────────────────
            let valStr = this._formatParamVal(p);
            fill(this._col.text);
            textAlign(LEFT, TOP);
            textSize(10);
            textFont('Courier');
            text(p.label, cx, y);

            fill(this._col.accent);
            textAlign(RIGHT, TOP);
            text(valStr, cx + cw, y);

            y += 14;

            // ── Is it a boolean toggle? ──────────────────────────
            let isBool = (p.min === 0 && p.max === 1 && p.step === 1);

            if (isBool) {
                let swW = 44, swH = 22;
                let swX = cx, swY = y - 4;
                let on = p.val >= 0.5;

                fill(on ? this._col.green : this._col.btn);
                rect(swX, swY, swW, swH, 11);

                fill(this._col.text);
                let knobX = on ? swX + swW - swH + 2 : swX + 2;
                ellipse(knobX + swH / 2 - 2, swY + swH / 2, swH - 6, swH - 6);

                fill(on ? this._col.green : this._col.dim);
                textAlign(LEFT, CENTER);
                textSize(10);
                textFont('Courier');
                text(on ? 'ON' : 'OFF', swX + swW + 8, swY + swH / 2);

                p._hitX = swX; p._hitY = swY; p._hitW = swW + 40; p._hitH = swH;
                p._isToggle = true;

                y += swH + 2;
            } else {
                let trackH = 8;
                let trackTop = y;

                fill(this._col.track);
                rect(cx, trackTop, cw, trackH, 4);

                let thumbX = map(p.val, p.min, p.max, cx + 4, cx + cw - 4);
                let isDragging = (paramIdx === this._paramDragIdx);
                fill(isDragging ? this._col.accent : this._col.thumb);
                ellipse(thumbX, trackTop + trackH / 2, isDragging ? 16 : 13, isDragging ? 16 : 13);

                p._hitX = cx; p._hitY = trackTop - 6; p._hitW = cw; p._hitH = trackH + 12;
                p._isToggle = false;

                y += trackH + 4;
            }

            // ── Note ────────────────────────────────────────
            if (p.note) {
                fill(this._col.dim);
                textAlign(LEFT, TOP);
                textSize(8);
                textFont('Courier');
                text(p.note, cx, y);
                y += 13;
            }

            y += 6;
            paramIdx++;
        }

        // ── Store total content height for scroll bounds ─────────
        this._paramsContentH = y - startY + this._paramsScrollY + 20;

        pop(); // end clip

        // ── Scrollbar (if content overflows) ─────────────────────
        if (this._paramsContentH > clipH) {
            let barH = max(10, clipH * (clipH / this._paramsContentH));
            let maxScroll = this._paramsContentH - clipH;
            let barY = startY + (this._paramsScrollY / maxScroll) * (clipH - barH);
            fill(this._col.btn);
            rect(px + this.pw - 8, barY, 4, barH, 2);
        }

        // ── Hint text at bottom ─────────────────────────────────
        if (this._paramsContentH > clipH + 5) {
            fill(this._col.dim);
            textAlign(CENTER, BOTTOM);
            textSize(8);
            textFont('Courier');
            text('scroll ↑↓ for more', px + this.pw / 2, height - 8);
        }
    }


    _formatParamVal(p) {
        if (p.step >= 1 || Number.isInteger(p.step)) {
            return String(p.val);
        }
        // Determine decimal places from step size
        let decimals = 2;
        if (p.step >= 0.1) decimals = 1;
        if (p.step < 0.01) decimals = 3;
        return p.val.toFixed(decimals);
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

        if (this.activeTab === 'params') {
            // Check param slider hits
            for (let i = 0; i < this._params.length; i++) {
                let p = this._params[i];
                if (p._hitX !== undefined && this._isOver(p._hitX, p._hitY, p._hitW, p._hitH)) {
                    if (p._isToggle) {
                        // Toggle switches: flip value
                        p.val = p.val >= 0.5 ? 0 : 1;
                        if (p.apply) p.apply(p.val);
                    } else {
                        // Sliders: start drag
                        this._paramDragIdx = i;
                        this._updateParamSlider(p);
                    }
                    return true;
                }
            }
            return false;
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

        // Save / Load
        if (this._isOverB(this._saveBtn)) {
            this._saveBrain();
            return true;
        }
        if (this._isOverB(this._loadBtn)) {
            this._loadBrain();
            return true;
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
        this._paramDragIdx = -1;
    }


    handleMouseDragged() {
        if (this._speedS.drag) this._updateSlider(this._speedS);
        if (this._paramDragIdx >= 0) {
            let p = this._params[this._paramDragIdx];
            if (p) this._updateParamSlider(p);
        }
    }


    handleKey(key, keyCode) {
        if (key === 'J' || key === 'j') {
            this.visible = !this.visible;
            return true;
        }
        return false;
    }


    handleWheel(delta) {
        if (!this.visible || this.activeTab !== 'params') return false;
        // Only scroll if content overflows
        let clipH = height - this._tabY - 35;
        if (this._paramsContentH <= clipH) return false;
        let maxScroll = this._paramsContentH - clipH;
        this._paramsScrollY = constrain(this._paramsScrollY + delta * 0.5, 0, maxScroll);
        return true;
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
                population = new Population(populationSize);
            }
        }
    }


    _saveBrain() {
        if (testingSinglePlayer || !population) return;
        let best = population.players[population.bestPlayerIndex];
        let data = {
            gen: population.gen,
            bestHeight: population.bestHeight,
            bestLevel: population.currentBestLevelReached,
            instructions: best.brain.toJSON()
        };
        let jsonStr = JSON.stringify(data, null, 2);
        // Trigger download
        let blob = new Blob([jsonStr], {type: 'application/json'});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'brain-gen' + population.gen + '.json';
        a.click();
        URL.revokeObjectURL(url);
    }


    _loadBrain() {
        let input = document.getElementById('brainFileInput');
        if (!input) {
            // Create hidden input on the fly
            input = document.createElement('input');
            input.type = 'file';
            input.id = 'brainFileInput';
            input.accept = '.json';
            input.style.display = 'none';
            document.body.appendChild(input);
        }
        input.onchange = (e) => {
            let file = e.target.files[0];
            if (!file) return;
            let reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    let data = JSON.parse(ev.target.result);
                    if (!data.instructions) {
                        print("Invalid brain file: no instructions");
                        return;
                    }
                    // Create a player from the saved brain
                    let importedBrain = Brain.fromJSON(data.instructions);
                    let importedPlayer = new Player();
                    importedPlayer.brain = importedBrain;
                    importedPlayer.hasFinishedInstructions = false;

                    if (!testingSinglePlayer && population) {
                        // Replace the worst player with the imported brain
                        let worstIdx = 0;
                        for (let i = 1; i < population.players.length; i++) {
                            if (population.players[i].fitness < population.players[worstIdx].fitness) {
                                worstIdx = i;
                            }
                        }
                        population.players[worstIdx] = importedPlayer;
                        print("Loaded brain from gen", data.gen || "?");
                    } else {
                        // Create a new population with this brain as the first player
                        testingSinglePlayer = false;
                        population = new Population(populationSize);
                        population.players[0] = importedPlayer;
                    }
                } catch (err) {
                    print("Failed to load brain:", err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }


    _updateSlider(s) {
        let v = map(mouseX, s.x, s.x + s.w, s.min, s.max);
        s.val = floor(constrain(v, s.min, s.max));
        if (s === this._speedS) evolationSpeed = s.val;
    }


    _updateParamSlider(p) {
        let cx = this.px + 12;
        let cw = this.pw - 24;
        let v = map(mouseX, cx, cx + cw, p.min, p.max);
        v = constrain(v, p.min, p.max);
        // Snap to step
        if (p.step >= 1) {
            v = round(v / p.step) * p.step;
        } else {
            let decimals = (String(p.step).split('.')[1] || '').length;
            v = round(v / p.step) * p.step;
            v = parseFloat(v.toFixed(decimals));
        }
        p.val = v;
        if (p.apply) p.apply(v);
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
