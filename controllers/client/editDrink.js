const urlParams = new URLSearchParams(window.location.search);
const drinkId = urlParams.get('id');

async function updateNutrition() {

    let recipe = buildRecipe();
    /** @type {liveNutritionResult} */
    let nutrition = 
        await new Promise(resolve=>$.ajax({
            type: 'POST',
            url: '/api/liveNutrition',
            data: JSON.stringify ({recipe: recipe}),
            success: resolve,
            contentType: "application/json",
            dataType: 'json'
        }));

    $(".servPpVal").html(nutrition.servingsPerPackage);
    $(".servSzVal").html(nutrition.servingWeight+"g");
    $(".servSzVal").html(nutrition.servingWeight+"g");
    $(".stdDrinks span").html(nutrition.stdDrinks);

    $("table.nutritionTable .valRow").remove();
    let microHeaderRow = $("table.nutritionTable .microHeaderRow");
    let appendixRow = $("table.nutritionTable .appendix");
    for (let nut of nutrition.mainNutrients) {
        let elem = $(`
        <tr class="valRow${nut.subVal?' subVal':''}${(nut.rdiPercent && nut.rdiPercent >= 50) || nut.name==="ALCOHOL, ETHYL"?' yellowHl':''}">
            <td class="nName">${nut.name}</td>
            <td class="nQtyPs">${nut.amountPerServing} ${nut.unit}</td>
            <td class="nDI">${nut.rdiPercent === null ? '-' : nut.rdiPercent === 0 ? '<1%' : nut.rdiPercent+"%"}</td>
            <td class="nQty100">${nut.amountPer100g} ${nut.unit}</td>
        </tr>`);
        elem.insertBefore(microHeaderRow);
    }
    for (let nut of nutrition.microNutrients) {
        if (nut.amountPerServing === 0) continue;
        let elem = $(`
        <tr class="valRow micro${nut.subVal?' subVal':''}${(nut.rdiPercent && nut.rdiPercent >= 50) || nut.name==="ALCOHOL, ETHYL"?' yellowHl':''}">
            <td class="nName">${nut.name}</td>
            <td class="nQtyPs">${nut.amountPerServing} ${nut.unit}</td>
            <td class="nDI">${nut.rdiPercent === null ? '-' : nut.rdiPercent === 0 ? '<1%' : nut.rdiPercent+"%"}</td>
            <td class="nQty100">${nut.amountPer100g} ${nut.unit}</td>
        </tr>`);
        elem.insertBefore(appendixRow);
    }
    let goodRows = $("tr.ingredientRow:not(.bad)");
    $(".ingEnergyCell").text("? kJ");
    for (let i = 0; i< nutrition.individualEnergies.length; i++) {
        let energy = nutrition.individualEnergies[i];
        if (energy === null || energy === undefined) energy = '?';
        $(goodRows[i]).find(".ingEnergyCell").text(energy + " kJ");
    }
}

function buildRecipe(includeUnknowns) {
    let lines;
    if (includeUnknowns) {
        lines = [...$(".ingredientRow")];
    } else {
        lines = [...$(".ingredientRow:not(.bad)")];
    }
    let recipe = lines.map(x=>{
        let $x = $(x);
        let result = {
            ingredient: $x.find(".ingredientEdit").val(),
            amount: Number($x.find(".qtyEdit").val()),
            unit: $x.find(".measureCell").attr("data-unit"),
        };
        result.measure = result.amount + " " + result.unit;
        if (isNaN(result.amount)) result.amount = 0;
        return result;
    });
    return recipe;
}

/** @param {JQuery} elem */
async function openDropdown(elem) {
    let text = elem.val();
    let data;
    if (text.length) {
        data = await new Promise(resolve=>$.get("/api/instantIngredient/"+encodeURIComponent(text), (data)=>resolve(data)));
        if (!data) data = [];
    } else {
        data = [];
    }
    let ddElem = $('<div class="dropdown-menu show"></div>');
    for (let ing of data) {
        let ddLine = $(`<div class="dropdown-item" data-unit="${ing.unit}">${ing.ingredient}</div>`);
        ddLine.click((event)=>{
            elem.val(ing.ingredient);
            markBad(elem, false);
            let row = elem.parents("tr.ingredientRow");
            row.find(".measureUnit").text(ing.unit);
            row.find(".measureCell").attr("data-unit", ing.unit);
            row.find(".ingImg").attr("src", ing.imageURL || '/img/noImage.png');
            ddElem.remove();
            updateNutrition();
        });
        ddElem.append(ddLine);
    }
    let ddWrapper = elem.parent();
    if (!ddWrapper.is(".dropdown")) {
        ddWrapper = $("<div class='dropdown'></div>");
        elem.wrap(ddWrapper);
    }
    ddElem.insertAfter(elem);
}
function markBad(elem, state) {
    if (state === true || state === undefined) {
        elem.addClass("bad");
        elem.parent().addClass("bad");
        let row = elem.parents("tr.ingredientRow");
        row.addClass("bad");
        row.find(".ingImg").attr("src", '/img/noImage.png');
        $(".badWarning").show();
    } else {
        elem.removeClass("bad");
        elem.parent().removeClass("bad");
        let row = elem.parents("tr.ingredientRow");
        row.removeClass("bad");
        if ($(".bad").length === 0)
            $(".badWarning").hide();
    }
}
function ingEditKeyupHandler(event) {
    let target = $(event.target)
    target.siblings(".dropdown-menu").remove();
    markBad(target, true);
    openDropdown(target);
}
function ingEditBlurHandler(event) {
    setTimeout(()=>{
        let target = $(event.target)
        target.siblings(".dropdown-menu").remove();
    }, 100);
}
function qtyEditChangeHandler(event) {
    updateNutrition();
}
function btnDeleteIngredientClickHandler(event) {
    let target = $(event.target);
    target.parents(".ingredientRow").remove();
    updateNutrition();
}
$(".addIngredient").click(()=>{
    let newRow = $(`
    <tr class="ingredientRow">
        <td><img class="ingImg" src="/img/noImage.png" onerror="this.onerror=null; this.src='/img/noImage.png'" /></td>
        <td class="ingredientCell">
            <div class="dropdown">
                <input type="text" class="form-control ingredientEdit" value="" placeholder="New Ingredient">
            </div>
        </td>
        <td class="measureCell" data-unit="ml">
            <input type="number" class="form-control qtyEdit" value="0" min="0.1" step="0.1" max="10000">
            <span class="measureUnit">
                ml
            </span>
        </td>
        <td class="ingEnergyCell">0 kJ</td>
        <td><i class="fas fa-times btnDeleteIngredient"></i></td>
    </tr>`);
    newRow.find(".ingredientEdit").keyup(ingEditKeyupHandler).blur(ingEditBlurHandler);
    newRow.find(".qtyedit").change(qtyEditChangeHandler);
    newRow.find(".qtyedit").change(qtyEditChangeHandler);
    newRow.find(".btnDeleteIngredient").click(btnDeleteIngredientClickHandler);
    $(".ingredients tbody").append(newRow);
    markBad(newRow.find(".ingredientEdit"));
});

$(".ingredientEdit").keyup(ingEditKeyupHandler);
$(".ingredientEdit").blur(ingEditBlurHandler);
$(".qtyedit").change(qtyEditChangeHandler);
$(".btnDeleteIngredient").click(btnDeleteIngredientClickHandler);

$(".saveBtn").click(async ()=>{
    /** @type {{id:number, name:string, category: string, method : string, recipe: recipeLine[]}} */
    let drinkData = {
        id: drinkId, 
        name: $(".titleEdit").val(),
        category: $(".categoryEdit").val(),
        method: $(".methodEdit").val(),
        recipe: buildRecipe(true)
    };
    // validate everything is good
    if (!drinkData.name || !drinkData.name.length) {
        alert("Drink must have a name");
        return;
    }
    if (!drinkData.category || !drinkData.category.length) {
        alert("Drink must have a category");
        return;
    }
    if (!drinkData.method || !drinkData.method.length) {
        alert("Drink must have a method");
        return;
    }
    if (!drinkData.recipe || !drinkData.recipe.length) {
        alert("Drink must have at least one ingredient");
        return;
    }
    let ingNamesUnique = drinkData.recipe.map(x=>x.ingredient.toLowerCase()).filter((value, index, self)=>self.indexOf(value) === index);
    if (ingNamesUnique.length !== drinkData.recipe.length) {
        alert("Drink cannot contain duplicate ingredients");
        return;
    }
    if (!drinkData.recipe.every(x=>x.amount && !isNaN(x.amount))) {
        alert("All quantities must be a positive, real value");
        return;
    }
    try {
        await new Promise((resolve, reject)=>$.ajax({
            type: 'POST',
            url: '/api/saveRecipe',
            data: JSON.stringify(drinkData),
            success: resolve,
            error: reject,
            contentType: "application/json",
            dataType: 'json'
        }));
        window.location.href = "/Drink?id="+drinkId;
    } catch(e) {
        alert(e.responseJSON.message);
    }
});

 /** 
 * @typedef {object} liveNutritionResult
 * @property {number} stdDrinks
 * @property {number} servingWeight
 * @property {number} servingsPerPackage
 * @property {nutritionTableRow[]} mainNutrients
 * @property {nutritionTableRow[]} microNutrients
 * @property {number[]} individualEnergies The energy of each individual ingredient, in kJ
 */

  /** 
  * @typedef {object} nutritionTableRow
  * @property {string} name
  * @property {number} amountPerServing
  * @property {number} rdiPercent
  * @property {number} amountPer100g
  * @property {string} unit
  * @property {bool} subValue
  */

  /** 
 * @typedef {object} recipeLine
 * @property {number} ingredientID
 * @property {number} amount
 * @property {string} unit
 * @property {string} ingredient
 * @property {string} measure Simply the amount and the unit combined with a space
 */
