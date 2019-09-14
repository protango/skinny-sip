// Perform search operation through ajax api calls, this speeds up initial page load times.
var urlParams = new URLSearchParams(location.search);
if (!urlParams.has('term') || urlParams.get("term").length === 0) window.location.replace("/");
$.get( "/api/Search/"+urlParams.get("term"), (data) => {
    for (var drink of data) {
        // build div to display result
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
        newElem.attr("href", "/Drink?id="+drink.id);
        // add search result to page
        $("#resultContainer").append(newElem);
    }
    // if there were no results, show the no results element
    if (!data.length) $("#noResults").show();
    // remove loader
    $(".lds-ring").remove();
});
