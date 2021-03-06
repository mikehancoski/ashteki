describe('Quick Strike attacks', function () {
    beforeEach(function () {
        this.setupTest({
            player1: {
                phoenixborn: 'aradel-summergaard',
                inPlay: ['seaside-raven', 'mist-spirit', 'iron-worker'],
                spellboard: ['summon-butterfly-monk']
            },
            player2: {
                phoenixborn: 'coal-roarkwin',
                inPlay: ['flute-mage'],
                spellboard: [],
                dicepool: ['natural', 'natural', 'charm', 'charm'],
                hand: ['anchornaut']
            }
        });
    });

    it('defender may choose to counter', function () {
        expect(this.fluteMage.tokens.damage).toBeUndefined();
        expect(this.seasideRaven.tokens.damage).toBeUndefined();

        this.player1.clickPrompt('Attack');
        this.player1.clickCard(this.fluteMage); // target
        this.player1.clickCard(this.seasideRaven); // single attacker

        this.player2.clickPrompt('Done'); // no guard
        this.player2.clickPrompt('Yes'); // DO counter

        // flute mage is dead
        expect(this.fluteMage.location).toBe('discard');
        // seaside is unhurt - it has quickstrike
        expect(this.seasideRaven.tokens.damage).toBeUndefined();
        expect(this.seasideRaven.exhausted).toBe(true);
    });
});
