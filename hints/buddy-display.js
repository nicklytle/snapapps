require('hint-display');
require('../logging/assignment');

function BuddyDisplay() {
    window.buddyDisplay = this;
    this.snapViewerDialog = new Dialog("snap-viewer", "Snap Viewer", nop);// set callback function later
}

BuddyDisplay.prototype = Object.create(HintDisplay.prototype);

BuddyDisplay.prototype.initDisplay = function() {
    this.button = window.ide.controlBar.addCustomButton('shareButton', localize("Share My Work"), BuddyDisplay.showShareDialog);
    this.button = window.ide.controlBar.addCustomButton('viewButton', localize("View Other's Work"), BuddyDisplay.showViewDialog);
    this.snapViewerDialog.allowClose(true);
};

BuddyDisplay.prototype.show = function() {
    if (this.button) {
        this.button.show();
    }
};

BuddyDisplay.prototype.hide = function() {
    if (this.button) {
        this.button.hide();
    }
};

BuddyDisplay.prototype.alwaysActive = function() {
    return true;
};

BuddyDisplay.prototype.getHintType = function() {
    return 'buddy';
};

BuddyDisplay.prototype.clear = function() {
};

BuddyDisplay.serializer = new SnapSerializer();

BuddyDisplay.showViewDialog = function() {
    var viewDialog = new DialogBoxMorph();
    var inp = new AlignmentMorph('column', 2);
    var txtbox = new InputFieldMorph();
    var txt = new TextMorph(
        "Who's project do you want to view?",
        12,
        null, // style
        true, // bold
        null, // italic
        null, // alignment
        null, // width
        null, // font name
        MorphicPreferences.isFlat ? null : new Point(1, 1),
        new Color(255, 255, 255) // shadowColor
    );

    inp.alignment = 'left';
    txtbox.setWidth(200);
    inp.setColor(new Color(255, 255, 255, 1));
    inp.add(txt);

    if (Assignment.isPairProgramming()) {
        var annotation = new TextMorph(
            "(Autofilled with your partner's id)",
            12,
            null, // style
            false, // bold
            true, // italic
            null, // alignment
            null, // width
            null, // font name
            MorphicPreferences.isFlat ? null : new Point(1, 1),
            new Color(255, 255, 255) // shadowColor
        );
        inp.add(annotation);
        txtbox.contents().text.text = window.partner.user_id + "/" + window.user.user_id;
    }

    inp.add(txtbox);
    viewDialog.addBody(inp);

    txt.drawNew();
    txtbox.drawNew();
    inp.drawNew();
    txtbox.fixLayout();
    inp.fixLayout();

    viewDialog.addButton("ok", "Go");
    viewDialog.addButton("cancel", "Cancel");
    viewDialog.labelString = "View Project";
    viewDialog.createLabel();
    viewDialog.action = function() {
        var view = txtbox.getValue().trim();
        $.post('logging/getShareCodeUser.php', {
            'user_name': view
        }, function(data, status) {
            // if new user, display user doesn't exist message.
            if (data == "new user") {
                ide.inform("Invalid User", 
                    'We could not find a recent project to load from this user\n' +
                    '"' + view + '"\n' + 
                    'Make sure they shared their project using the "share my project" button.'); // might be able to 
            }
            // if existing user, log into snap account.
            else {
                var project_id = JSON.parse(data).id;
                var url = window.buddyDisplayBaseUrl + "?user=" + window.userID + "&view=" + view + "&projectid=" + project_id;

                if (window.openViewerInNewWindow) {
                    var winWidth = ide.width() * 0.9;
                    var winHeight = ide.height() * 0.9;
                    var left = (screen.width - winWidth) / 2;
                    var top = (screen.height - winHeight) / 2;
                    var options = "menubar=yes,location=no,resizable=yes,scrollbars=yes,status=no"
                        + ",width=" + winWidth
                        + ",height=" + winHeight
                        + ",top=" + top
                        + ",left=" + left; // doesn't work in chrome, no idea why...
                    window.open(url, "_blank", options);
                }
                else {
                    window.buddyDisplay.snapViewerDialog.fitToWindow(50);
                    // remove the "leave site, unsaved" message, when opening iframe
                    var tmp = window.onbeforeunload;
                    window.onbeforeunload = null;
                    window.buddyDisplay.snapViewerDialog.show(url, nop);
                    // adding the "leave site, unsaved" message back
                    window.onbeforeunload = tmp;
                }

                
            }
        }).fail(function(xhr, status, error) {
            window.alert(xhr.responseText);
        });
    }
    viewDialog.drawNew();
    viewDialog.fixLayout();

    viewDialog.popUp(window.world);
    txtbox.edit();
}

BuddyDisplay.showShareDialog = function() {
    var code = BuddyDisplay.serializer.serialize(ide.stage);
    var user = window.userID;
    var xhr = new XMLHttpRequest();
    var myself = this;
    var dialog = new DialogBoxMorph();
    var xhr = new XMLHttpRequest();
    var url = "logging/sharecode.php?userID=" + encodeURI(user)
        + "&assignmentID=" + encodeURI(Assignment.getID()); // Left off here

    dialog.askYesNo("Share My Work", "Are you sure you want to share this project? \n" +
        "(This will replace the project that you shared before)", window.world);

    dialog.action = function() {
        xhr.onreadystatechange = function() {
            if (!(xhr.status === 200 && xhr.readyState === 4)) return;
            Trace.log('BuddyDisplay.savedProject');
            new DialogBoxMorph().inform('Project Saved',
                'Project saved!\n' + 'Now others can view your project using\n"' + user + '"',
                window.world);
        };

        xhr.open('POST', url, true);
        xhr.send(code);
    }
    dialog.drawNew();
    dialog.fixLayout();
    dialog.popUp();
}

