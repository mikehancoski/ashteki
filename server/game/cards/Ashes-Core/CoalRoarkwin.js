const Card = require('../../Card.js');

class CoalRoarkwin extends Card {
    setupCardAbilities(ability) {
        this.action({
            title: 'Slash',
            cost: [ability.costs.sideAction(), ability.costs.chosenDiscard()],
            target: {
                // target a Unit, or if no units then the pb is valid
                cardType: ['Ally', 'Conjuration', 'Phoenixborn'],
                // cardCondition: (card) => {
                //     ['Ally', 'Conjuration'].includes(card.cardType) ||
                //         card.controller.cardsInPlay.length == 0; // implies the cardtype is pb
                // },
                controller: 'opponent',
                gameAction: ability.actions.dealDamage({ amount: 1 })
            }
        });
    }
}

CoalRoarkwin.id = 'coal-roarkwin';

module.exports = CoalRoarkwin;
