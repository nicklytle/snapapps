modules.cellular = '2013-August-16';

/*
** The Cell type. Holds cell attributes and objects that are present in this cell.
*/
function Cell(x,y,stageMorph)
{
	this.x = x;
	this.y = y;
	this.stageMorph = stageMorph;
	this.attributeValues = {};
	this.spriteMorphs = [];
	this.parentECT = null;
}

/*
** Gets the value of some attribute.
*/
Cell.prototype.getAttribute = function(attribute)
{
	value = this.attributeValues[attribute];
	if (!value)
		return 0;
	return Number(value);
}

/*
** Sets the value of an attribute in this cell.
**
** The dirty parameter is true unless otherwise specified, 
** and if true, this cell is queued for re-drawing.
*/
Cell.prototype.setAttribute = function(attribute, value, dirty)
{
	this.attributeValues[attribute] = Number(value);
	if (dirty)
		this.stageMorph.dirtyCellAt(this.x, this.y);
}

/*
** Removes a SpriteMorph that is present in the cell.
*/
Cell.prototype.removeSpriteMorph = function(morph)
{
	var index = this.spriteMorphs.indexOf(morph);
	if (index > -1) {
		this.spriteMorphs.splice(index, 1);
	}
}

/*
** Adds a SpriteMorph that is present in the cell.
*/
Cell.prototype.addSpriteMorph = function(morph)
{
	this.spriteMorphs.push(morph);
}

/*
** A list of attribute names
*/
Cell.attributes = [];

/*
** A list of attribute colours. Uses the Snap! colour object.
*/
Cell.attributeColours = {};

/*
** A list of 2 element arrays corresponding to the start and end of the draw range for this attribute.
*/
Cell.attributeDrawRange = {};

// For visible attributes, see StageMorph.visibleAttributes.
Cell.hasAttribute = function (name)
{
	for (var i=0; i<Cell.attributes.length; i++)
	{
		if (Cell.attributes[i] == name)
		{
			return true;
		}
	}
	return false;
}

Cell.addAttribute = function (name)
{
	//Ensure it does not exist already
	for (var i=0; i<Cell.attributes.length; i++)
	{
		if (Cell.attributes[i] == name)
			return false;
	};
	//Create the attribute
	Cell.attributes.push(name);
	Cell.attributeColours[name] = new Color(100,100,100);
	Cell.attributeDrawRange[name] = [0,10];
	return true;
}

/*
** The EmptyCellTree is uesd to find the nth empty cell in log(N) time.
*/
function EmptyCellTree(childA, childB)
{
    var myself = this;
    
    function attachChild(child)
    {
	    if (child instanceof EmptyCellTree)
	    {
            child.parent = myself;
            myself.nEmpty += child.nEmpty;
        }
        else if (child instanceof Cell)
        {
            myself.leafNode = true;
            child.parentECT = myself;
            myself.nEmpty += child.spriteMorphs.length == 0 ? 1 : 0;
        }
    }

    this.parent = null;
    this.nEmpty = 0;
    this.leafNode = false;
    
	this.childA = childA;
	attachChild(childA);
        
	this.childB = childB;
	attachChild(childB);
}

EmptyCellTree.prototype.cellMadeEmpty = function()
{
    this.nEmpty++;
    if (this.parent != null)
        this.parent.cellMadeEmpty();
}

EmptyCellTree.prototype.cellFilled = function()
{
    this.nEmpty--;
    if (this.parent != null)
        this.parent.cellFilled();
}