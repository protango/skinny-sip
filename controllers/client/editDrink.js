async function updateNutrition() {

    let recipe = buildRecipe();
    /** @type {liveNutritionResult} */
    let nutrition = 
        await new Promise(resolve=>$.post("/api/liveNutrition", {recipe:recipe}, data=>resolve(data), "json"));

    $(".servPpVal").html(nutrition.servingsPerPackage);
    $(".servSzVal").html(nutrition.servingWeight+"g");
    $(".servSzVal").html(nutrition.servingWeight+"g");
    $(".stdDrinks span").html(nutrition.stdDrinks);

    $("table.nutritionTable .valRow").remove();
    let microHeaderRow = $("table.nutritionTable .microHeaderRow");
    let appendixRow = $("table.nutritionTable .appendix");
    for (let nut of nutrition.mainNutrients) {
        let elem = $(`
        <tr class="valRow${nut.subVal?' subVal':''}${(nut.rdiPercent && nut.rdiPercent >= 50) || nut.name==="Alcohol, ethyl"?' yellowHl':''}">
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
        <tr class="valRow micro${nut.subVal?' subVal':''}${(nut.rdiPercent && nut.rdiPercent >= 50) || nut.name==="Alcohol, ethyl"?' yellowHl':''}">
            <td class="nName">${nut.name}</td>
            <td class="nQtyPs">${nut.amountPerServing} ${nut.unit}</td>
            <td class="nDI">${nut.rdiPercent === null ? '-' : nut.rdiPercent === 0 ? '<1%' : nut.rdiPercent+"%"}</td>
            <td class="nQty100">${nut.amountPer100g} ${nut.unit}</td>
        </tr>`);
        elem.insertBefore(appendixRow);
    }

}

function buildRecipe() {
    let lines = [...$(".ingredientRow")];
    let recipe = lines.map(x=>{
        let $x = $(x);
        let result = {
            ingredient: $x.find(".ingredientEdit").val(),
            amount: Number($x.find(".qtyEdit").val()),
            unit: $x.find(".measureCell").attr("data-unit"),
        };
        result.measure = result.amount + " " + result.unit;
        return result;
    });
    return recipe;
}

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