import dat from "dat.gui";

class Gui
{
    constructor()
    {
        if(!Gui.instance)
        {
            this.datGui = new dat.GUI();
            Gui.instance = this;
        }
        return Gui.instance;
    }
    // Creates slider of vector with min and max values
    addVectorSlider(vector, name, min, max)
    {
        let folder = this.datGui.addFolder(name);
        this.folder = folder;
        folder.add(vector, 'x', min, max)
        folder.add(vector, 'y', min, max)
        folder.add(vector, 'z', min, max)

        folder.__controllers[0].name('x');
        folder.__controllers[1].name('y');
        folder.__controllers[2].name('z');
    }
}
export default Gui;
