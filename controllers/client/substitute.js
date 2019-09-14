var debounceautofilltimeout = null;
var goodSelection = false;
// keydown handler for displaying autofill results
$("#substitute").on("keydown", (e) => {
    if (e.key==="ArrowDown") { // handle keyboard navigation of dropdown [Down]
        let activeitem = $(".dropdown-item.active");
        if (activeitem.length) {
            activeitem.removeClass("active");
            let nextitem = activeitem.next();
            if (nextitem.length) {
                nextitem.addClass("active");
            } else {
                $(".dropdown-item:first-child").addClass("active");
            }
        } else {
            $(".dropdown-item:first-child").addClass("active");
        }
        return false;
    } else if (e.key==="ArrowUp") {// handle keyboard navigation of dropdown [Up]
        let activeitem = $(".dropdown-item.active");
        if (activeitem.length) {
            activeitem.removeClass("active");
            let previtem = activeitem.prev();
            if (previtem.length) {
                previtem.addClass("active");
            } else {
                $(".dropdown-item:last-child").addClass("active");
            }
        } else {
            $(".dropdown-item:last-child").addClass("active");
        }
        return false;
    } else if (e.key==="Enter") { // handle keyboard navigation of dropdown [Enter]
        $(".dropdown-item.active").mousedown();
        $("#autofill").hide();
        e.preventDefault();
        return false;
    }
    if (debounceautofilltimeout) { // if a debounce timer is already in progress, cancel it.
        clearTimeout(debounceautofilltimeout);
        debounceautofilltimeout = null;
    }
    $("#autofill").empty();
    goodSelection = false;
    debounceautofilltimeout = setTimeout(function() { // wait 300ms before querying server, to facilitate debouncing
        debounceautofilltimeout = null;
        $.get("/api/IngredientAutoComplete/"+$("#substitute").val(), (response) => {
            if (!(response && response.common)) return;
            for (let item of response.common) {
                let ddItem = $('<a class="dropdown-item">'+item.food_name+'</a>');
                ddItem.on("mousedown", () => {
                    goodSelection = true;
                    $("#substitute").val(item.food_name);
                });
                $("#autofill").append(ddItem);
            }
            $("#autofill").show();
        });
    }, 300);
});
$("#substitute").on("focus", (e) => {
    $("#autofill").show()
});
$("#substitute").on("blur", (e) => {
    setTimeout(()=>$("#autofill").hide(), 100);
});

$("#substituteForm").submit(function(e){
    if (!goodSelection) {
        $("#ddWarn").show();
        e.preventDefault();
    }
});