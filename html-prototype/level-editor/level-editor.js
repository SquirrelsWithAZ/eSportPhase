(function(window) {

    // Global variables.
    var state = window.state = {
        $actor_select: null,
        $editor: null,
        $grid_container: null,
        $map_tab: null,
        $map_tab_body: null,
        editor: null,

        parsedJson: null,
        in_error: false,

        delay_counter: 0,
        selected_actor: null,

        map: {},
        actor_lookups: {}
    };

    /**
     * Sets up an actor with a randomized default image, if it doesn't already have one assigned.
     */
    function defaultAtlas(actor) {
        if(!(actor.editor)) { actor.editor = {}; }
        if(!(actor.editor.img)) {
            actor.editor.img = "default-atlas.png";
            actor.editor.left = Math.floor(Math.random() * 4);
            actor.editor.top = Math.floor(Math.random() * 4);
            actor.editor.width = actor.editor.height = 1;
        }
    }

    /**
     * Handles moving from the raw JSON input to the map data structure. Also does some happy fun-time validation.
     */
    function processRawJson() {
        var cur_json = state.editor.getValue();
        if(cur_json === state.parsedJson) { return; }

        try {
            var map = $.parseJSON(cur_json);

            if(!(map instanceof Object)) { throw "Map file must be a JSON object"; }

            if(typeof(map.tileCountI) !== "number") { throw "Missing int .tileCountI"; }
            if(typeof(map.tileCountJ) !== "number") { throw "Missing int .tileCountJ"; }
            if(typeof(map.tileWidth) !== "number") { throw "Missing int .tileWidth"; }
            if(typeof(map.tileHeight) !== "number") { throw "Missing int .tileHeight"; }

            if(!(map.actors) || !(map.actors instanceof Array)) { throw "Missing .actors[]"; }
            if(!(map.layout) || !(map.layout instanceof Object) || (map.layout instanceof Array)) { throw "Missing .layout{}"; }

            if(Math.floor(map.tileCountI) !== map.tileCountI) { throw ".tileCountI must be integral" }
            if(Math.floor(map.tileCountJ) !== map.tileCountJ) { throw ".tileCountJ must be integral" }

            var actor_lookups = {};
            $.each(map.actors, function(i, v) {
                if(!(v instanceof Object) || (v instanceof Array)) { throw "Expected .actors[" + i + "] to be an object"; }
                if(!(v.type) || typeof(v.type) !== "string") { throw "Missing string .actors[" + i + "].type"; }
                if(!(v.prefab) || typeof(v.prefab) !== "string") { throw "Missing string .actors[" + i + "].prefab"; }
                if(actor_lookups[v.type]) { throw ".actors[" + i + "] duplicates actor type '" + v.type + "'"; }

                actor_lookups[v.type] = v;
            });

            if(!(map.layout.props) || !(map.layout.props instanceof Array)) { throw "Missing array .layout.props"; }
            $.each(map.layout.props, function(i, v) {
                if(!(v instanceof Object) || (v instanceof Array)) { throw "Expected .layout.props[" + i + "] to be an object" }
                if(!(v.type) || typeof(v.type) !== "string") { throw "Missing string .layout.props[" + i + "].type"; }
                if(typeof(v.i) !== "number") { throw "Missing int .layout.props[" + i + "].i"; }
                if(typeof(v.j) !== "number") { throw "Missing int .layout.props[" + i + "].j"; }
                if(Math.floor(v.i) !== v.i) { throw ".layout.props[" + i + "].i must be integral"; }
                if(Math.floor(v.j) !== v.j) { throw ".layout.props[" + i + "].j must be integral"; }
                if(v.args && (!(v.args instanceof Object) || (v.args instanceof Array))) { throw "Expected .layout.props[" + i + "].args to be an object"; }
                if(!(actor_lookups[v.type])) { throw ".layout.props[" + i + "].type references unknown actor '" + v.type + "'"; }
            });

            if(!(map.layout.tiles) || !(map.layout.tiles instanceof Array)) { throw "Missing array .layout.tiles"; }
            if(map.layout.tiles.length !== map.tileCountI * map.tileCountJ) { throw "Expected " + (map.tileCountI * map.tileCountJ) + " tiles in .layout.tiles"; }
            $.each(map.layout.tiles, function(i, v) {
                if(!(v instanceof Object) || (v instanceof Array)) { throw "Expected .layout.tiles[" + i + "] to be an object"; }
                if(typeof(v.type) !== "string") { throw "Missing string .layout.tiles[" + i + "].type"; }
                if(v.args && (!(v.args instanceof Object) || (v.args instanceof Array))) { throw "Expected .layout.tiles[" + i + "].args to be an object"; }
                if(!(actor_lookups[v.type])) { throw ".layout.tiles[" + i + "].type references unknown actor '" + v.type + "'"; }
            });

            state.$editor.css("background-color", "");
            state.$map_tab.find("a").html("Map");

            state.in_error = false;
            state.parsedJson = cur_json;

            state.map = map;
            state.actor_lookups = actor_lookups;
        }
        catch(e) {
            console.error(e);
            state.in_error = true;

            state.$editor.css("background-color", "#fee");
            state.$map_tab.find("a").html("Map - JSON error: " + e);

            return;
        }

        renderMap();
    }

    /**
     * Edit an individual tile.
     */
    function editTile() {
        var $this = $(this);
    }

    /**
     * Build the map structure into DIVs on the page for editing.
     */
    function renderMap() {
        state.$grid_container.empty();

        if(state.in_error) {
            state.$grid_container.html("Fix JSON errors, bitch!");
        }
        else {
            var size = Math.floor(Math.min(
                (state.$map_tab_body.width() - 60) / state.map.tileCountI,
                (state.$map_tab_body.height() - 60) / state.map.tileCountJ
            ));

            for(var i = 0 ; i < state.map.tileCountI; i++) {
                for(var j = 0; j < state.map.tileCountJ; j++) {
                    var $div = $(document.createElement("DIV"));
                    $div.addClass("grid-tile");
                    $div.css("width", (size - 2) + "px");  // -2 to account for border
                    $div.css("height", (size - 2) + "px"); // -2 to account for border
                    $div.css("left", size * i + "px");
                    $div.css("top", size * j + "px");

                    $div.click(editTile);

                    state.$grid_container.append($div);
                }
            }

            var w = size * state.map.tileCountI;
            var h = size * state.map.tileCountJ;

            state.$grid_container.css("height", h + "px");
            state.$grid_container.css("width", w + "px");
            state.$grid_container.css("top", "50%");
            state.$grid_container.css("left", "50%");
            state.$grid_container.css("margin-top", "-" + Math.floor(h / 2) + "px");
            state.$grid_container.css("margin-left", "-" + Math.floor(w / 2) + "px");

            var old_selected_actor = state.selected_actor;
        }
    }

    /**
     * Kick of everything on page-load.
     */
    $(function() {
        // Set up the editor.
        state.editor = ace.edit("json-editor");
        state.editor.setTheme("ace/github");
        state.editor.getSession().setMode("ace/mode/json");

        // Grab some DOM elements.
        state.$actor_select = $("#tile-type");
        state.$editor = $(state.editor.container);
        state.$grid_container = $("#grid-container");
        state.$map_tab = $("#map-tab-header");
        state.$map_tab_body = $("#map");

        // Wire up events.
        state.editor.on("blur", processRawJson);
        //state.editor.on("change", function() {
        //   var expected_counter = ++state.delay_counter;
        //    window.setTimeout(
        //        1000,
        //        function() { if(state.delay_counter === expected_counter) { processRawJson(); } }
        //    );
        //});

        // Parse and render the map.
        processRawJson();
    });

})(window);
