# what ?


![sheetcaster](https://github.com/scarunkk/sheetcaster/raw/master/example.png)

This had been originally done at a [Google Apps Script hackaton](http://apps-dev-tour.appspot.com/) but has since been improved (and debugged).

# howto

1.  Create a new spreadsheet in Google Documents
2.  Go to `Tools -> Scripts -> Script Editor`
3.  Paste sheetcaster.js into the window and hit save
4.  Reload the spreadsheet, maybe multiple times. A menu `Sheetcaster` should appear near `help`
5.  Select `Sheetcaster -> Reset` to start the engine

You can now move by using the menu !

The default FOV and resolution can be changed by modifiying constants at the top of the code.

# bugs

-   It's very slow, we can't do much about it since it runs on server side.
-   Collisions are currently not handled (yet simple).

# authors

-   [Thomas Coudray](http://github.com/amanone)
-   [Ahmed Bougacha](http://github.com/qikon)
-   [Geoffroy Aubey](http://github.com/wotan)
-   [Amaury de la Vieuville](http://github.com/scarunkk)
