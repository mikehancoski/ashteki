const Card = require('../../Card.js');

class HammerKnight extends Card {
    setupCardAbilities(ability) {
        this.persistentEffect({
            effect: ability.effects.addKeyword({ alert: 1 })
        });

        this.forcedReaction({
            when: {
                onCardDestroyed: (event, context) =>
                    event.damageEvent &&
                    event.damageEvent.fightEvent &&
                    event.damageEvent.damageSource === context.source &&
                    event.damageEvent.fightEvent.attacker === context.source
            },
            target: {
                activePromptTitle: 'Aftershock 1',
                waitingPromptTitle: 'Aftershock 1: waiting for opponent',
                cardType: ['Ally', 'Conjuration'],
                gameAction: ability.actions.dealDamage({ amount: 1 })
            }
        });
    }
}

HammerKnight.id = 'hammer-knight';

module.exports = HammerKnight;
