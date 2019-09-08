var urlParams = new URLSearchParams(location.search);
if (!urlParams.has('term')) window.location.replace("/");
$.get( "/api/Search/"+urlParams.get("term"), (data) => {
    for (var drink of data) {
        var newElem = $("#resultTemplate").clone();
        newElem.css("display", "");
        newElem.attr("id", "");
        newElem.find("img").attr("src", drink.img);
        newElem.find("h4").text(drink.name);
        newElem.find("p i").text(drink.desc);
        for (var tag of drink.tags) {
            newElem.find("div div").append(
                $("<span class='badge badge-secondary ml-1'>"+tag+"</span>")
            );
        }
        $("#resultContainer").append(newElem);
    }
    $(".lds-ring").remove();
});
