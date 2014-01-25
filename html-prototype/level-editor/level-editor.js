(function(window) {

    // Global variables.
    var state = window.state = {
        editor: null,
        map: {
            tileCountI: 2,
            tileCountJ: 2,
            tileWidth: 3,
            tileHeight: 3,
            layout: [
                { prefab : "Tile_Type_A" },
                { prefab : "Tile_Type_A" },
                { prefab : "Tile_Type_A" },
                { prefab : "Tile_Type_B" }
            ]
        }
    };

    $(function() {
        // Set up the editor.
        state.editor = ace.edit("json-editor");
        state.editor.setTheme("ace/github");
        state.editor.getSession().setMode("ace/mode/json");
    });

})(window);
