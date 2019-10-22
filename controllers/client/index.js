// On page load, get the 3 random images at the bottom via AJAX call to api
// This speeds up initial page load times
$.get( "/api/Random/3", (data) => { 
    let imgLoadCount = 0;
    for (let i = 0; i<3; i++) {
        $.get(data[i].img, ()=>{
            $("#lnk"+(i+1)).attr("href", "/Drink?id="+data[i].id);
            $("#lnk"+(i+1)+" div").remove();
            $("#lnk"+(i+1)+" span").text(data[i].name);
            $("#lnk"+(i+1)).prepend($("<img src='"+data[i].img+"' />"));
        });
    }
});
