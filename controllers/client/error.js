var cocktaildbOnline =undefined;
var nutritionixOnline = undefined;

function renderStatus(cocktaildbOnline, nutritionixOnline) {
    if (cocktaildbOnline === undefined || nutritionixOnline === undefined)
        return;
    
}

$.get("/api/ServiceStatus", (result) => {
    //cocktail db is online
    cocktaildbOnline = result.cocktaildbOnline;
    nutritionixOnline = result.nutritionixOnline;
    renderStatus();
}, () => {
    //failed to contact api
    cocktaildbOnline = false;
    nutritionixOnline = false;
    renderStatus();
});