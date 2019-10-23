$("i.editBtn").on("click", (e)=> {
    return;
    let target = $(e.target);
    let textBox = target.prev();
    let cell = textBox.parent();
    let row = cell.parent();

    let number = Number(cell.attr("data-qty"));
    let unit = cell.attr("data-unit").toLowerCase();
    if (unit.includes("fruit ") || unit.includes("lime")) unit = "serving";
    if (unit.includes("can ")) unit = "can";

    let allowedUnits = ["serving", "g", "ml", "oz", "fl oz", "cup", "tsp", "tbsp", "pinch", "shot", "dash"];
    if (!allowedUnits.includes(unit)) allowedUnits.push(unit);
    allowedUnits = allowedUnits.sort();

    cell.empty();

    let numberElem = $("<input min='0.1' max='9999' step='0.1' type='number' class='ingEdit' name='ingEditQty"+(row.index()+1)+"' value='"+number+"' />");
    let unitElem = $("<select name='ingEditUnit"+(row.index()+1)+"'></select>");
    for (let nUnit of allowedUnits) {
        let option = $("<option value='"+nUnit+"'"+(nUnit.toLowerCase()===unit ? " selected" : "")+">"+nUnit+"</option>");
        unitElem.append(option);
    }

    cell.append(numberElem);
    cell.append(unitElem);

    $("#editButtons").show();
});