let alreadyShowingSnow = false;


class Population {

    constructor(size) {
        this.popSize = size;
        this.players = [];
        for (let i = 0; i < size; i++) {
            this.players.push(new Player());
        }

        this.showingFail = false;
        this.failPlayerNo = 0;
        this.bestPlayerIndex = 0;
        this.currentHighestPlayerIndex = 0;
        this.fitnessSum = 0;
        this.gen = 1;
        this.bestHeight = 0;
        this.showingLevelNo = 0;
        this.currentBestLevelReached = 0;
        this.purgeTheSlackers = false;
        this.reachedBestLevelAtActionNo = 0;
        this.newLevelReached = false;
        this.cloneOfBestPlayerFromPreviousGeneration = this.players[0].clone();

        // ── Stagnation tracking ─────────────────────────────────
        this.gensSinceNewLevel = 0;
        this.lastLevelGen = 1;
    }

    Update() {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].Update();
        }
    }

    SetBestPlayer() {

        this.bestPlayerIndex = 0;
        this.newLevelReached = false;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].bestHeightReached > this.players[this.bestPlayerIndex].bestHeightReached) {
                this.bestPlayerIndex = i;
            }
        }

        if (this.players[this.bestPlayerIndex].bestLevelReached > this.currentBestLevelReached) {
            this.currentBestLevelReached = this.players[this.bestPlayerIndex].bestLevelReached;
            this.newLevelReached = true;
            this.reachedBestLevelAtActionNo = this.players[this.bestPlayerIndex].bestLevelReachedOnActionNo;
            print("NEW LEVEL, action number", this.reachedBestLevelAtActionNo)
            this.gensSinceNewLevel = 0;
            this.lastLevelGen = this.gen;
        }
        this.bestHeight = this.players[this.bestPlayerIndex].bestHeightReached;
    }

    SetCurrentHighestPlayer() {
        this.currentHighestPlayerIndex = 0;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].GetGlobalHeight() > this.players[this.currentHighestPlayerIndex].GetGlobalHeight()) {
                this.currentHighestPlayerIndex = i;
            }
        }
    }

    Show() {

        this.SetCurrentHighestPlayer()
        let highestPlayer = this.players[this.currentHighestPlayerIndex];
        let highestLevelNo = this.players[this.currentHighestPlayerIndex].currentLevelNo;

        if(highestPlayer.currentLevelNo > highestPlayer.bestLevelReached && !highestPlayer.progressionCoinPickedUp){
            highestLevelNo -=1;
        }
        showLevel(highestLevelNo);
        alreadyShowingSnow = false;
        this.showingLevelNo = highestLevelNo;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].currentLevelNo >= highestLevelNo - 1 && this.players[i].currentLevelNo <=highestLevelNo ) {
                this.players[i].Show();
            }
        }
    }


    ResetAllPlayers() {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].ResetPlayer();
        }
    }

    IncreasePlayerMoves(increaseBy) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].brain.increaseMoves(increaseBy);
        }
    }

    AllPlayersFinished() {
        for (let i = 0; i < this.players.length; i++) {
            if (!this.players[i].hasFinishedInstructions) {
                return false;
            }
        }
        return true;
    }

    // ── Natural Selection ────────────────────────────────────────

    NaturalSelection() {
        this.SetBestPlayer();
        this.CalculateFitnessSum();

        this.cloneOfBestPlayerFromPreviousGeneration = this.players[this.bestPlayerIndex].clone();

        // ── Stagnation → diversity restart ───────────────────────
        if (!this.newLevelReached) {
            this.gensSinceNewLevel++;
        }
        if (this.gensSinceNewLevel >= stagnationLimit) {
            this._diversityRestart();
            this.gen++;
            this.gensSinceNewLevel = 0;
            return;
        }

        let nextGen = [];

        // ── Keep top N% as elites (no mutation) ─────────────────
        let eliteCount = max(1, ceil(this.players.length * elitePercent));

        // Sort by fitness descending for elite selection
        let sorted = this._getSortedByFitness();
        for (let i = 0; i < eliteCount; i++) {
            nextGen.push(sorted[i].clone());
        }

        // ── Fill the rest ─────────────────────────────────────────
        let useCross = crossoverRate > 0 && random() < crossoverRate;

        for (let i = eliteCount; i < this.players.length; i++) {
            let baby;

            if (useCross) {
                // Crossover between two tournament-selected parents
                let pA = this.SelectParent();
                let pB = this.SelectParent();
                baby = new Player();
                baby.brain = Brain.crossover(pA.brain, pB.brain);
                baby.playerStateAtStartOfBestLevel = pA.playerStateAtStartOfBestLevel.clone();
                baby.brain.parentReachedBestLevelAtActionNo = min(
                    pA.bestLevelReachedOnActionNo,
                    pB.bestLevelReachedOnActionNo
                );
            } else {
                // Clone from single parent
                let parent = this.SelectParent();
                baby = parent.clone();
                if (parent.fellToPreviousLevel) {
                    baby.brain.mutateActionNumber(parent.fellOnActionNo);
                }
            }

            // Mutation
            if (adaptiveMutate) {
                // Increase mutation when stagnating
                let stagnationFactor = 1 + (this.gensSinceNewLevel / max(1, stagnationLimit)) * 2;
                let actualRate = min(mutationRate * stagnationFactor, 0.5);
                this._mutateWithRate(baby.brain, actualRate);
            } else {
                baby.brain.mutate();
            }

            nextGen.push(baby);
        }

        // Check if nextGen has correct number of elite-preserved players
        this.players = [];
        for (let i = 0; i < nextGen.length; i++) {
            this.players[i] = nextGen[i];
        }

        this.gen++;
    }


    CalculateFitnessSum() {
        this.fitnessSum = 0;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].CalculateFitness();
            // If killBad is on, zero out players below the best level
            if (killBadPlayers && this.players[i].bestLevelReached < this.players[this.bestPlayerIndex].bestLevelReached) {
                this.players[i].fitness = 0;
            }
            this.fitnessSum += this.players[i].fitness;
        }

        // ── Rank-based fitness ───────────────────────────────────
        if (useRankFitness) {
            let sorted = this._getSortedByFitness();
            for (let i = 0; i < sorted.length; i++) {
                // Linear rank: best = N, worst = 1
                sorted[i].fitness = sorted.length - i;
            }
            this.fitnessSum = (sorted.length * (sorted.length + 1)) / 2;
        }
    }


    SelectParent() {
        if (tournamentSize > 0) {
            return this._tournamentSelect();
        }
        // Roulette (fallback)
        let rand = random(this.fitnessSum);
        let runningSum = 0;
        for (let i = 0; i < this.players.length; i++) {
            runningSum += this.players[i].fitness;
            if (runningSum > rand) {
                return this.players[i];
            }
        }
        return this.players[this.players.length - 1];
    }


    // ── Tournament Selection ─────────────────────────────────────

    _tournamentSelect() {
        let best = null;
        let bestFitness = -Infinity;
        let n = min(tournamentSize, this.players.length);
        for (let i = 0; i < n; i++) {
            let idx = floor(random(this.players.length));
            let p = this.players[idx];
            if (p.fitness > bestFitness) {
                bestFitness = p.fitness;
                best = p;
            }
        }
        return best;
    }


    // ── Diversity Restart ────────────────────────────────────────

    _diversityRestart() {
        print("DIVERSITY RESTART — stagnation for", this.gensSinceNewLevel, "generations");
        let eliteCount = max(1, ceil(this.players.length * elitePercent));
        let sorted = this._getSortedByFitness();

        let newPlayers = [];
        // Keep elites
        for (let i = 0; i < eliteCount; i++) {
            newPlayers.push(sorted[i].clone());
        }
        // Re-randomize the rest
        for (let i = eliteCount; i < this.players.length; i++) {
            let clone = sorted[i % sorted.length].clone();
            clone.brain = new Brain(startingPlayerActions);
            newPlayers.push(clone);
        }
        this.players = newPlayers;
        this.gensSinceNewLevel = 0;
    }


    // ── Helpers ──────────────────────────────────────────────────

    _mutateWithRate(brain, rate) {
        for (let i = brain.parentReachedBestLevelAtActionNo; i < brain.instructions.length; i++) {
            if (random() < chanceOfNewInstruction) {
                brain.instructions[i] = brain.getRandomAction();
            } else if (random() < rate) {
                brain.instructions[i].mutate();
            }
        }
    }


    _getSortedByFitness() {
        return [...this.players].sort((a, b) => b.fitness - a.fitness);
    }
}
