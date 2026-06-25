class AIAction {
    constructor(isJump, holdTime, xDirection) {
        this.isJump = isJump;
        this.holdTime = holdTime;//number between 0 and 1
        this.xDirection = xDirection;

    }

    clone() {
        return new AIAction(this.isJump, this.holdTime, this.xDirection);
    }

    mutate() {
        this.holdTime += random(-0.3,0.3);
        this.holdTime = constrain(this.holdTime,0.1,1);
    }
}


// let jumpChance = 0; //the chance that a random action is a jump
let jumpChance = 0.5; //the chance that a random action is a jump
let chanceOfFullJump = 0.2;
// let chanceOfFullJump = 0.2;

// ── Mutation parameters (now globals — adjustable via dashboard) ──
let mutationRate = 0.1;
let chanceOfNewInstruction = 0.03;

class Brain {

    constructor(size, randomiseInstructions = true) {
        this.instructions = [];
        this.currentInstructionNumber = 0;
        if (randomiseInstructions)
            this.randomize(size);
        this.parentReachedBestLevelAtActionNo = 0;
    }

    randomize(size) {
        for (let i = 0; i < size; i++) {
            this.instructions[i] = this.getRandomAction();
        }
    }

    getRandomAction() {
        let isJump = false;

        if (random() > jumpChance) {
            isJump = true;
        }

        let holdTime = random(0.1, 1);
        if(random()<chanceOfFullJump){
            holdTime = 1;
        }


        let directions = [-1, -1, -1, 0, 1, 1, 1]
        let xDirection = random(directions)


        return new AIAction(isJump, holdTime, xDirection)
    }

    getNextAction() {
        if(this.currentInstructionNumber >= this.instructions.length){
            return null;
        }
        this.currentInstructionNumber += 1;
        return this.instructions[this.currentInstructionNumber - 1];
    }


    clone() {
        let clone = new Brain(this.size, false);
        clone.instructions = [];
        for (let i = 0; i < this.instructions.length; i++) {
            clone.instructions.push(this.instructions[i].clone())
        }
        return clone;
    }

    mutate() {
        for (let i = this.parentReachedBestLevelAtActionNo; i < this.instructions.length; i++) {
            if (random() < chanceOfNewInstruction) {
                this.instructions[i] = this.getRandomAction()
            } else if (random() < mutationRate) {
                this.instructions[i].mutate();
            }
        }
    }

    mutateActionNumber(actionNumber){
        // let mutationRate = 0.1;

        actionNumber -=1; // this is done because im a bad programmer
        if (random() < chanceOfNewInstruction) {
            this.instructions[actionNumber] = this.getRandomAction()
        } else{
            this.instructions[actionNumber].mutate();
        }
    }

    increaseMoves(increaseMovesBy){
        for(var i = 0 ; i< increaseMovesBy ;i++){
            this.instructions.push(this.getRandomAction());
        }

    }

    // ── Crossover ───────────────────────────────────────────────
    // Creates a new brain combining instructions from two parents.
    // Single-point crossover at a random position.
    static crossover(brainA, brainB) {
        let child = new Brain(0, false);
        let lenA = brainA.instructions.length;
        let lenB = brainB.instructions.length;
        let minLen = min(lenA, lenB);
        let point = floor(random(1, minLen));  // at least 1 from each parent

        child.instructions = [];
        for (let i = 0; i < point; i++) {
            child.instructions.push(brainA.instructions[i].clone());
        }
        for (let i = point; i < minLen; i++) {
            child.instructions.push(brainB.instructions[i].clone());
        }
        // If one parent has more instructions, copy the tail
        if (lenA > minLen) {
            for (let i = minLen; i < lenA; i++) {
                child.instructions.push(brainA.instructions[i].clone());
            }
        } else if (lenB > minLen) {
            for (let i = minLen; i < lenB; i++) {
                child.instructions.push(brainB.instructions[i].clone());
            }
        }

        child.parentReachedBestLevelAtActionNo = min(
            brainA.parentReachedBestLevelAtActionNo,
            brainB.parentReachedBestLevelAtActionNo
        );
        return child;
    }

    // ── Export / Import --------------------------------------------
    toJSON() {
        return this.instructions.map(a => ({
            j: a.isJump,
            h: a.holdTime,
            x: a.xDirection
        }));
    }

    static fromJSON(data) {
        let brain = new Brain(0, false);
        brain.instructions = data.map(d => new AIAction(d.j, d.h, d.x));
        return brain;
    }

}
