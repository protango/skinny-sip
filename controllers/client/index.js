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
