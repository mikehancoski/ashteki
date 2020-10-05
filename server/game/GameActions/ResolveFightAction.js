const CardGameAction = require('./CardGameAction');

class ResolveFightAction extends CardGameAction {
    setup() {
        this.name = 'attack';
        this.targetType = ['Ally'];
        this.effectMsg = 'make {1} fight {0}';
        this.effectArgs = this.attacker;
    }

    canAffect(card, context) {
        if (
            card.location !== 'play area' ||
            !this.attacker ||
            this.attacker.location !== 'play area'
        ) {
            return false;
        } else if (
            !this.attacker.checkRestrictions('fight') ||
            card.controller === this.attacker.controller
        ) {
            return false;
        } else if (
            !card.checkRestrictions('attackDueToTaunt') &&
            !this.attacker.ignores('taunt') &&
            context.stage !== 'effect'
        ) {
            return false;
        }

        return card.checkRestrictions(this.name, context) && super.canAffect(card, context);
    }

    getEvent(card, context) {
        let params = {
            card: card,
            context: context,
            condition: (event) =>
                event.attacker.location === 'play area' && event.card.location === 'play area',
            attacker: this.attacker,
            attackerClone: this.attacker.createSnapshot(),
            attackerTarget: card,
            defenderTarget: this.attacker,
            destroyed: []
        };
        return super.createEvent('onFight', params, (event) => {
            event.attacker.unenrage();

            if (!this.canAffect(event.card, event.context)) {
                event.card.elusiveUsed = true;
                return;
            }

            let damageEvent;
            let defenderAmount = event.card.power;
            if (event.card.anyEffect('limitFightDamage')) {
                defenderAmount = Math.min(
                    defenderAmount,
                    ...event.card.getEffects('limitFightDamage')
                );
            }

            let defenderParams = {
                amount: defenderAmount,
                fightEvent: event,
                damageSource: event.card
            };
            let attackerAmount =
                event.attacker.power + event.attacker.getBonusDamage(event.attackerTarget);
            if (event.attacker.anyEffect('limitFightDamage')) {
                attackerAmount = Math.min(
                    attackerAmount,
                    ...event.attacker.getEffects('limitFightDamage')
                );
            }

            let attackerParams = {
                amount: attackerAmount,
                fightEvent: event,
                damageSource: event.attacker
            };
            if (
                !event.card.getKeywordValue('elusive') ||
                event.card.elusiveUsed ||
                event.attacker.ignores('elusive')
            ) {
                if (
                    (!event.attacker.getKeywordValue('skirmish') ||
                        event.defenderTarget !== event.attacker) &&
                    event.card.checkRestrictions('dealFightDamage') &&
                    event.attackerTarget.checkRestrictions('dealFightDamageWhenDefending')
                ) {
                    damageEvent = context.game.actions
                        .dealDamage(defenderParams)
                        .getEvent(event.defenderTarget, context);
                }

                if (event.attacker.checkRestrictions('dealFightDamage')) {
                    if (damageEvent) {
                        damageEvent.addChildEvent(
                            context.game.actions
                                .dealDamage(attackerParams)
                                .getEvent(event.attackerTarget, context)
                        );
                    } else {
                        damageEvent = context.game.actions
                            .dealDamage(attackerParams)
                            .getEvent(event.attackerTarget, context);
                    }
                }
            } else if (
                event.attackerTarget !== event.card &&
                event.attacker.checkRestrictions('dealFightDamage')
            ) {
                damageEvent = context.game.actions
                    .dealDamage(attackerParams)
                    .getEvent(event.attackerTarget, context);
            }

            event.card.elusiveUsed = true;
            if (damageEvent) {
                event.card.isFighting = true;
                event.attacker.isFighting = true;
                context.game.checkGameState(true);
                damageEvent.openReactionWindow = false;
                context.game.openEventWindow(damageEvent);
                context.game.queueSimpleStep(() => {
                    event.addChildEvent(damageEvent);
                    damageEvent.openReactionWindow = true;
                    event.card.isFighting = false;
                    event.attacker.isFighting = false;
                });
            }
        });
    }
}

module.exports = ResolveFightAction;
