require('hint-display');
require('../logging/assignment');


// TODO: Rename to VectorHintDispplay or something
function PairsDisplay() {

}

PairsDisplay.prototype = Object.create(HintDisplay.prototype);

PairsDisplay.prototype.initDisplay = function() {

};

PairsDisplay.prototype.show = function() {
    if (!Assignment.isPairProgramming()) {
        this.hide();
        this.active = false;
        return;
    }
    Trace.log('PairsDisplay.show');

    this.hintButton =
        this.addHintButton(localize('Swap Roles'), PairsDisplay.showSwapDialog, false); // the third parameter is for setting the isHitnButton false.
};

PairsDisplay.prototype.hide = function() {
    if (this.hintButton) this.hintButton.destroy();
};

PairsDisplay.prototype.alwaysActive = function() {
    return Assignment.isPairProgramming();
};

PairsDisplay.prototype.getHintType = function() {
    return 'pairs';
};

PairsDisplay.prototype.clear = function() {
};

PairsDisplay.serializer = new SnapSerializer();

PairsDisplay.showSwapDialog = function() {
    var code = PairsDisplay.serializer.serialize(ide.stage);
    var users = Assignment.getUsers();
    if (!code || users.length != 2) {
        new DialogBoxMorph().inform('Not Pair Programming',
        'We do not detect a pair programming partner.')
    }

    var user1 = users[0];
    users.sort();
    var userA = users[0];
    var userB = users[1];
    var fromUserA = (user1 == userA) ? 1 : 0;
    var guid = newGuid();

    var url = 'logging/checkpoint.php?userIDA=' + encodeURI(userA) +
        '&userIDB=' + encodeURI(userB) +
        '&fromUserA=' + encodeURI(fromUserA) +
        '&guid=' + encodeURI(guid);

    var xhr = new XMLHttpRequest();
    var myself = this;

    var dialog = new DialogBoxMorph();
    dialog.addText(localize('Swap Roles?'),
        localize('If you were just writing code as the Driver, SAVE your code now.\n' +
        'If you are about to write code as the Driver, LOAD your partner\'s\n' +
        'code after they have saved it.'));

    var logData = {
        userIDA: userA,
        userIDB: userB,
        fromUserA: fromUserA,
        guid: guid,
    };

    dialog.addButton(function() {
        logData.newRole = 'Navigator';
        Trace.log('PairsDisplay.roleSwapTo', logData);
        this.destroy();

        xhr.onreadystatechange = function() {
            if (!(xhr.status === 200 && xhr.readyState === 4)) return;
            Trace.log('PairsDisplay.savedProject');
            new DialogBoxMorph().inform('Project Saved',
                'Project saved! Now your partner should Load the project.',
                window.world);
        };

        xhr.open('POST', url, true);
        xhr.send(code);
    }, 'Save (finish Driving)');

    dialog.addButton(function() {
        logData.newRole = 'Driver';
        Trace.log('PairsDisplay.roleSwapTo', logData);
        this.destroy();

        xhr.onreadystatechange = function() {
            if (!(xhr.status === 200 && xhr.readyState === 4)) return;
            Trace.log('PairsDisplay.receivedProject');
            var response = xhr.responseText;
            if (!response || !response.startsWith('<project')) {
                new DialogBoxMorph().inform('No Pair Project Saved',
                    'We could not find a recent project to load from your partner.\n' +
                    'Make sure they saved recently by switching to Navigator.',
                    window.world);
                Trace.log('PairsDisplay.noProjectToLoad');
                return;
            }

            new DialogBoxMorph(this, function() {
                Trace.log('PairsDisplay.loadProject');
                window.ide.openProjectString(response);
            }).askYesNo('Overwrite Code?',
            'This will load your partner\'s project and overwrite your own.\n' +
            'Are you sure you want to continue?',
            window.world);
        };

        xhr.open('GET', url, true);
        xhr.send();
    }, 'Load (start Driving)');


    dialog.addButton('cancel', 'Cancel');
    dialog.drawNew();
    dialog.fixLayout();
    dialog.popUp(window.world);
};

DialogBoxMorph.prototype.addText = function (
    title,
    textString
) {
    var txt = new TextMorph(
        textString,
        this.fontSize,
        this.fontStyle,
        true,
        false,
        'center',
        null,
        null,
        MorphicPreferences.isFlat ? null : new Point(1, 1),
        new Color(255, 255, 255)
    );

    if (!this.key) {
        this.key = 'inform' + title + textString;
    }

    this.labelString = title;
    this.createLabel();
    if (textString) {
        this.addBody(txt);
    }
};