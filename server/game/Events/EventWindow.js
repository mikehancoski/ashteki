const BaseStepWithPipeline = require('../gamesteps/basestepwithpipeline.js');
const ForcedTriggeredAbilityWindow = require('../gamesteps/forcedtriggeredabilitywindow.js');
const DestroyedAbilityWindow = require('../gamesteps/DestroyedAbilityWindow.js');
const SimpleStep = require('../gamesteps/simplestep.js');
const { AbilityType } = require('../../constants.js');
const TriggeredAbilityWindow = require('../gamesteps/triggeredabilitywindow.js');

class EventWindow extends BaseStepWithPipeline {
    constructor(game, event) {
        super(game);
        this.event = event;
        this.initialise();
    }

    initialise() {
        this.pipeline.initialise([
            new SimpleStep(this.game, () => this.checkEventCondition()),
            new SimpleStep(this.game, () => this.openAbilityWindow(AbilityType.ForcedInterrupt)),
            new SimpleStep(this.game, () => this.openAbilityWindow(AbilityType.Interrupt)),
            new SimpleStep(this.game, () => this.preResolutionEffects()),
            new SimpleStep(this.game, () => this.executeHandler()),
            new SimpleStep(this.game, () => this.checkGameState()),
            new SimpleStep(this.game, () => this.checkForSubEvent()),
            new SimpleStep(this.game, () => this.openAbilityWindow(AbilityType.ForcedReaction)),
            new SimpleStep(this.game, () => this.openAbilityWindow(AbilityType.Reaction))
        ]);
    }

    checkEventCondition() {
        this.event.checkCondition();
    }

    openAbilityWindow(abilityType) {
        let events = this.event.getSimultaneousEvents();
        if (
            events.length === 0 ||
            (abilityType === AbilityType.ForcedReaction && !this.event.openReactionWindow)
        ) {
            return;
        }

        if (
            abilityType === AbilityType.ForcedInterrupt &&
            events.some((event) => event.name === 'onCardLeavesPlay')
        ) {
            this.queueStep(new DestroyedAbilityWindow(this.game, abilityType, this));
        } else {
            if (abilityType === AbilityType.ForcedReaction) {
                this.game.checkDelayedEffects(events);
            }

            if ([AbilityType.ForcedReaction, AbilityType.ForcedInterrupt].includes(abilityType)) {
                this.queueStep(new ForcedTriggeredAbilityWindow(this.game, abilityType, this));
            } else {
                this.queueStep(new TriggeredAbilityWindow(this.game, abilityType, this));
            }
        }
    }

    preResolutionEffects() {
        for (let event of this.event.getSimultaneousEvents()) {
            this.game.emit(event.name + ':preResolution', event);
        }
    }

    executeHandler() {
        const events = this.event.getSimultaneousEvents();
        for (let event of events) {
            // need to checkCondition here to ensure the event won't fizzle due to another event's resolution (e.g. double honoring an ordinary character with YR etc.)
            event.checkCondition();
            if (!event.cancelled) {
                event.executeHandler();
                this.game.emit(event.name, event);
            }
        }
    }

    checkGameState() {
        const events = this.event.getSimultaneousEvents();
        if (!events.every((event) => event.noGameStateCheck)) {
            this.game.checkGameState(events.some((event) => event.handler));
        }
    }

    checkForSubEvent() {
        if (this.event.subEvent) {
            let currentSubEvent = this.event.subEvent;
            this.event.subEvent = null;
            this.queueStep(new EventWindow(this.game, currentSubEvent));
            if (!currentSubEvent.openReactionWindow) {
                this.queueStep(
                    new SimpleStep(this.game, () => {
                        this.event.addChildEvent(currentSubEvent);
                        currentSubEvent.openReactionWindow = true;
                    })
                );
            }

            this.queueStep(new SimpleStep(this.game, () => this.checkForSubEvent()));
        }
    }
}

module.exports = EventWindow;
