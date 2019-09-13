var debounceautofilltimeout = null;
var goodSelection = false;
$("#substitute").on("keydown", (e) => {
    if (e.key==="ArrowDown") {
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
    } else if (e.key==="ArrowUp") {
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
    } else if (e.key==="Enter") {
        $(".dropdown-item.active").mousedown();
        $("#autofill").hide();
        e.preventDefault();
        return false;
    }
    if (debounceautofilltimeout) {
        clearTimeout(debounceautofilltimeout);
    }
    $("#autofill").empty();
    goodSelection = false;
    debounceautofilltimeout = setTimeout(function() { 
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