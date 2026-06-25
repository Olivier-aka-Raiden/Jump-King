# Training Dashboard — Feature Plan

## Problème actuel

Tous les paramètres GA sont des variables globales **hardcodées** dans les fichiers JS. Pour changer quoi que ce soit, il faut éditer le code et rafraîchir. Le HUD actuel n'affiche que 4 infos texte en haut de l'écran.

## Dashboard — 5 Panels

### Panel 1: Training Controls (contrôles essentiels)
| Feature | Détail |
|---------|--------|
| ▶️ Play / ⏸️ Pause | Start/stop l'entraînement |
| 🎚️ Speed slider | Évolution speed de 1 à 200 (au lieu de ↑↓ qui fait 1 par 1) |
| 🔄 Reset | Remet tous les joueurs à zéro |
| 👤 ↔ 🤖 Mode toggle | Bascule Human/AI mode |
| ⏪ Replay best | Rejoue le meilleur joueur |
| Niveaux atteints | Liste des niveaux avec indicateur ✓/✗ |

### Panel 2: Live Stats (observabilité)
| Stat | Source |
|------|--------|
| Generation | `population.gen` |
| Best Height | `population.bestHeight` |
| Current Level | `population.currentBestLevelReached` |
| Actions/Brain | `players[0].brain.instructions.length` |
| FPS | `frameRate()` |
| Players alive | count de ceux pas `hasFinishedInstructions` |
| Gen/sec | générations complétées par seconde |
| Best fitness | `players[bestIndex].fitness` |
| Clock | temps écoulé depuis le début de l'entraînement |

### Panel 3: Params Panel (configuration live)
| Param | Valeur par défaut | Slider range |
|-------|-------------------|--------------|
| `populationSize` | 600 | 50 – 2000 |
| `startingPlayerActions` | 5 | 1 – 50 |
| `increaseActionsByAmount` | 5 | 1 – 20 |
| `increaseActionsEveryXGen` | 10 | 1 – 50 |
| `mutationRate` | 0.1 | 0 – 0.5 |
| `chanceOfNewInstruction` | 0.02 | 0 – 0.2 |
| `jumpChance` | 0.5 | 0 – 1 |
| `chanceOfFullJump` | 0.2 | 0 – 1 |

### Panel 4: Visualization (analyse)
| Feature | Description |
|---------|-------------|
| 📈 Fitness chart | Line chart fitness du best player au fil des générations |
| 📈 Height chart | Line chart best height par génération |
| 🗺️ Best path overlay | Chemin du meilleur joueur superposé sur le niveau |
| 🎯 Coin heatmap | Zones où les pièces sont ramassées |

### Panel 5: Save / Load (persistance)
| Feature | Description |
|---------|-------------|
| 💾 Export brain JSON | Sauvegarde le brain du best player |
| 📂 Import brain | Reprendre l'entraînement depuis un brain existant |
| 📋 Copy brain data | Presse-papier pour partager |

## Architecture Suggestion

Créer un fichier `dashboard.js` avec une classe `Dashboard` qui :

- Se dessine en **overlay** (pas dans la zone de jeu translatee)
- Est totalement optionnelle — le jeu tourne sans
- S'instancie dans `setup()` si un flag `showDashboard = true`
- Fournit des callbacks pour modifier les variables globales existantes

Pas de librairie UI externe — tout en p5.js pur (rect, text, sliders p5.js).

```js
class Dashboard {
    constructor() {
        this.panels = {
            controls: new ControlsPanel(),
            stats: new StatsPanel(),
            params: new ParamsPanel(),
            charts: new ChartsPanel(),
            saveLoad: new SaveLoadPanel()
        };
        this.collapsed = false; // mode réduit
        this.tabSelected = 'controls';
    }

    draw(population) {
        // Dessine en dehors du translate(0,50) de la zone de jeu
        // Dans la zone grise de la HUD bar + panel latéral
    }

    handleClick(mx, my) { /* routing click events */ }
    handleKey(k) { /* intercept keys */ }
}
```

## Étapes d'implémentation

1. ~~Créer la classe Dashboard squelette~~ À faire
2. Panel Contrôles (Play/Pause/Speed)
3. Panel Stats en direct
4. Panel Params (sliders)
5. Panel Charts (fitness over time)
6. Panel Save/Load
7. Refactoring : remplacer variables globales par un `GAParams` object central
8. Tests et polish
