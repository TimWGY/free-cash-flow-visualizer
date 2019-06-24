// __1__ //___________________ Data Processing_______________________//

    // formulas can be used in flashcard leanring webapp as well
    var formulas = ['Revenue = Sales * Price / K',
        'Total_variable = Power + Material1 + Material2',
        'Total_fixed = Labor + Maintenance + Other',
        'Total_costs = Total_variable + Total_fixed',
        'Other_charges = Selling + Research + Depreciation',
        'EBIT = Revenue - Total_costs - Other_charges',
        'Tax = EBIT * Tax_rate',
        'EBIAT = EBIT - Tax'];

    //copy/paste your raw data from excel to here please:
    var raw_data =
    `Sales       $32,000     $35,000     $38,000     $38,000     $38,000
Price        $415    $480    $520    $562    $606
Revenue      $13,280     $16,800     $19,760     $21,356     $23,028
Power        $6,304      $7,735      $9,386      $10,526     $10,013
Material1        $645    $791    $875    $940    $-
Material2        $1,285      $1,621      $1,753      $1,836      $1,956
Total_variable       $8,234      $10,147     $12,014     $13,302     $11,969
Labor        $1,180      $1,297      $1,427      $1,580      $1,738
Maintenance      $256    $277    $299    $322    $354
Other        $1,154      $1,148      $1,179      $1,113      $1,153
Total_fixed      $2,590      $2,722      $2,905      $3,015      $3,245
Total_costs      $10,824     $12,869     $14,919     $16,317     $15,214
Selling      $112    $125    $138    $152    $168
Research         $451    $478    $508    $543    $591
Depreciation         $1,060      $1,559      $1,611      $1,667      $1,727
Other_charges        $1,623      $2,162      $2,257      $2,362      $2,486
EBIT         $833    $1,770      $2,584      $2,677      $5,328
Tax      $333    $708    $1,034      $1,071      $2,131
EBIAT        $500    $1,062      $1,550      $1,606      $3,197
Tax_rate    0.4     0.4     0.4     0.4     0.4
K       1000    1000    1000    1000    1000 `


    var items_index = {};// A dictionary that mapps item names to the index of that data in dataset (which row)
    function processRawData(raw_data){
        var return_dataset = [];
        var rows = raw_data.split('\n'); //break the matrix into rows with '\n'
        let inline_breaking_pattern = /\s+/;  //break the row into cells with 'inline_breaking_pattern'
        for (let i = 0;i<rows.length;i++){
            var arrayed_row = rows[i].split(inline_breaking_pattern);
            item  = arrayed_row.shift();
            items_index[item] = i;
            for (let i = 0;i<arrayed_row.length;i++){
                var number_string = arrayed_row[i].replace(/\,|\$+/g, '').trim(); //cleaning the $ and ,
                if (number_string == '-'){                              //notice in Excel '-' means zero
                    arrayed_row[i] = 0;
                } else if (number_string[0] == '\(') {                  //notice in Excel '()' means negative
                    number_string = number_string.replace(/\(+|\)+/g, '').trim()
                    arrayed_row[i] = (-1)*Number(number_string);
                } else {
                    arrayed_row[i] = Number(number_string);
                }
            }
            arrayed_row.pop();
            return_dataset.push(arrayed_row);
        }
        return return_dataset
    }
    var dataset = processRawData(raw_data);

    // Record the names of all the variable items in a list, only create range sliders for these items
    var list_of_main_items = Object.keys(items_index);
    var list_of_dependent_items = ['Revenue','Total_variable','Total_fixed','Total_costs','Other_charges','EBIT','Tax','EBIAT'];
    let list_of_variable_items = [];
    for (let i = 0; i < list_of_main_items.length; i++) {
        if (list_of_dependent_items.includes(list_of_main_items[i])){
            dataset[i].fill(0); //dependent items will be re-calculated, thus reset them to zeros for now
        }else{
            list_of_variable_items.push(list_of_main_items[i]); //if not dependent, then must be variable items
        }
    }

    // Raw Data process finished, now need to deep copy the original values as a base data for further manipulations
    var base_data = [];
    for (let i = 0; i < dataset.length; i++) {
         var temp_row = [];
         for (let k = 0; k < dataset[i].length; k++) {
            temp_row.push(dataset[i][k]);
         }
         base_data.push(temp_row);
    }
    // Original Data of variables deep copied to base_data, now need to calculated the dependent items







    // Utility function to do basic (+ - * /) for two arrays
    function calculateTwoData(type,item1,item2,li1 = null,li2 = null){
        if (item1&&item2) { // mode 1: receive item names, and fetch the data by itself
            let result_list = [];
            var list1 = dataset[items_index[item1]];
            var list2 = dataset[items_index[item2]];
        } else if (li1&&li2) { // mode 2: receive ready numeric data, just inherit
            var list1 = li1;
            var list2 = li2;
        } else {
            return 0
        }

        let result_list = [];

        for (let i = 0; i < Math.max(list1.length,list2.length); i++) {
            if (list1&&list2){
                var result;
                if (type == '+'){
                     result = list1[i] + list2[i];
                } else if (type == '-'){
                     result = list1[i] - list2[i];
                } else if (type == '*'){
                     result = list1[i] * list2[i];
                } else if (type == '/'){
                     result = list1[i] / list2[i];
                }
                if(isNaN(result)){
                    console.log('NaN '+i+' /'+list1[i]+'/'+list2[i]+'/'+list1+'/'+list2);// error message report
                }
                result_list.push(result);
            } else {
                console.log('The lists length don\'t match, or non-exist') // error message report
                console.log('list1',list1);
                console.log('list2',list2);
            }
        }
        return result_list
    }


    //function to get the differece set of the two sets
    function removeFound(operated_list,reference_list){
        for (var i = 0; i < reference_list.length; i++) {
            var index = operated_list.indexOf(reference_list[i]);
            if (index > -1) {
                operated_list.splice(index, 1);
            }
        }
    }

    // calculateData function will deal with a string describing an equation
    function calculateData(string){
        var [item_name,right_hand] = string.split(' = ');
        var formula = right_hand.split(' ');
        var relevant_factors = [];
        num_operations = formula.length-1;
        for (let i = 0; i < num_operations; i+=2) {
            if (i == 0){
                results = calculateTwoData(formula[i+1],formula[i],formula[i+2]);
                relevant_factors.push(formula[i]);
                relevant_factors.push(formula[i+2]);

            } else {
                results = calculateTwoData(formula[i+1],0,0,results,dataset[items_index[formula[i+2]]]);
                relevant_factors.push(formula[i+2]);

            }
        }
        //now the function is building the item_grouping dictionary
        //but need to prevent main(dependent) items from being folded
        //that's why we use removeFound to get the differece set of the two sets
        removeFound(relevant_factors,list_of_dependent_items)

        if (relevant_factors[0]){ //if relevant_factors not empty, insert into groupig dictionary
            item_grouping[item_name] = relevant_factors;
        }
        //finally update the data in dataset
        dataset[items_index[item_name]] = results;
    }

    //run all the calculations described by the formulas
    function updateCalculation(){
        for (var i = 0; i < formulas.length; i++){
            calculateData(formulas[i]);
        }
    }


    //Group items by "dependent:[variables that determines it...]" Auto-created by parsing the formulas
    var item_grouping = {};
    //This is for making the two layers:
    //(main item):[sub-items that determines the value of main]   ->   (visible):[folded when load]  ->  left:[right]

    // Hide(or not create) the sub-items at first, expand when main item clicked
    // About the mechanism to fold the sub-items, "Hide" or "not create" depends on which mode
    window.addEventListener('click', function(event) {
        el = event.target;
        if (isNaN(el.textContent)){
            if(el.nodeName == 'text'){
                divs2display = item_grouping[el.textContent];
                if(divs2display){
                    if (Two_area_mode){
                        // *** Two_area_mode ***
                        // create and delete sections dynamically as user access them

                        createNewInPlace(divs2display);

                    } else {
                        // *** Free_adding_mode ***
                        // All the sections have been created upon initialization,
                        // toggle display attribute of the sections to hide or show

                        toggleDivsDisplay(divs2display);
                    }
                }
            }
        }
    });


    //Break down the formulas to a matrix for analyzing the relationships between factors
    var formulas_breakdown = [];
    for (let i = 0;i<formulas.length;i++){
        var temp_row = formulas[i].split(' ');
        formulas_breakdown.push(temp_row);
    }

    //Analyze the correlation relationship between items by looking at operators
    function highLightRelation(el,i){
        if (d3.select(el).text() == formulas_breakdown[i][0]){
            d3.select(el.parentNode).select("text").style("fill", "skyblue");
            for (let k = 2;k<formulas_breakdown[i].length;k+=2){
                if(formulas_breakdown[i][k-1] == '+' || formulas_breakdown[i][k-1] == '*' || formulas_breakdown[i][k-1] == '='){
                    title_color = 'lightgreen'; //Positively correlated with the item on the lefthand
                } else if (formulas_breakdown[i][k-1] == '-') {
                    title_color = 'pink'; //Negatively correlated with the item on the lefthand
                }
                d3.select('#'+formulas_breakdown[i][k]).select("text")
                .transition()
                .duration(300)
                .style("fill",title_color)
            }
        }
    }

    //Apply the highlight relationship function to titles, work on both dependent and independent items
    function showRelation(el){
        nowOverItem = d3.select(el).text();
        for (let i = 0;i<formulas_breakdown.length;i++){
            highLightRelation(el,i);
        }
        item_grouping_pairs = Object.entries(item_grouping);
        for(let i = 0;i<item_grouping_pairs.length;i++){
            if (item_grouping_pairs[i][1].includes(d3.select(el).text())){
                //console.log('leading item: '+item_grouping_pairs[i][0]);
                var element = document.getElementById('text_'+item_grouping_pairs[i][0]);
                for (let j = 0;j<formulas_breakdown.length;j++){
                    highLightRelation(element,j);
                }
            }
        }
    }
    //Reset all title colors to grey when mouse is out
    function cancelShowRelation(el){
        d3.selectAll(".title").style("fill", '#ddd');
        d3.select(el.parentNode).select("text").style("fill", "#ddd");
    }

    //Effect for item titles in general, using the two functions above showRelation and cancel
    function relationEffect(title){
        d3.select('#'+title)
        .select("text")
        .on("mouseover", function (d) {
            showRelation(this);
        })
        .on("mouseout", function (d) {
            cancelShowRelation(this);
        })
    }

    //Effect for certain item titles that can be clicked to unfold the second(middle) layer
    function expandableEffect(title){
        d3.select('#'+title)
        .select("text")
        .on("mouseover", function (d) {
            showRelation(this);
            d3.select(this.parentNode).select("text")
            .transition()
            .duration(300)
            .style("fill", "skyblue").style('cursor','pointer');
        })
        .on("mouseout", function (d) {
            cancelShowRelation(this);
            d3.select(this.parentNode).select("text").style("fill", "#ddd").style('cursor','pointer');

        })
    }

    function toggleDivsDisplay(list){
        if (list){
            for (let i = 0; i < list.length; i++) {
                div = document.getElementById('div_'+list[i]);
                if (div.style.display != 'none'){
                    div.setAttribute("style", "display:none;");
                } else if (div.style.display == 'none' && div.id != 'div_K'){
                    div.setAttribute("style", "display:inline;");
                }
            }
        } else {
            console.log('list_not_exist')
        }
    }

    //
    var inactiveArea ='';
    var lastClickedItem, nowOverItem, previousOverItem = '';
    function createNewInPlace(divs2display){
        // Jump out of the function if user is clicking the same item again
        if (nowOverItem == lastClickedItem){return 0}
        var fisrtArea = document.getElementById('up');
        var secondArea = document.getElementById('middle');
        // Selecting the place to create the divs and svgs,
        // If one area is empty then use it
        if (fisrtArea.firstElementChild==null){
            var place = '#up';
            inactiveArea ='#middle';

        } else if (secondArea.firstElementChild==null){
            var place = '#middle';
            inactiveArea ='#up';
        } else {
        // If both are occupied, then remove the inactive area to build new one
            //Clearing the space
            var Area = document.querySelector(inactiveArea);
            while (Area.firstChild) {
                Area.removeChild(Area.firstChild);
            }
            var place = inactiveArea;//indicate to div maker function this area is clean
            // Update which area is inactive based on current state
            inactiveArea = (inactiveArea=='#up')? '#middle':'#up';
        }
        // Dim the inactive part
        var dimArea = document.querySelector(inactiveArea);
        dimArea.setAttribute('style','opacity:0.6');

        // Build the divs and svgs
        if (divs2display){ //If it's not empty
            for(let i = 0;i<divs2display.length;i++){
                var item2show = divs2display[i];
                if (item2show != 'K'){
                    createDiv(item2show,place);
                    createBarChart(items_index[item2show]);

                    // Light up the previously dimmed area
                    var lightArea = document.querySelector(place);
                    lightArea.setAttribute('style','opacity:1');
                }
            }
        }
        initializeSlider(); // append the sliders to the sections displayed
        lastClickedItem = nowOverItem; // update which title is clicked just now
    }

    //___________________Initial Setting finished___________________________//


    //___________________Initial Calculation___________________________//

    updateCalculation();

    function getSnapShot(){
        var snapshot = [];
        for (let i = 0; i < dataset.length; i++) {
             var temp_row = [];
             for (let k = 0; k < dataset[i].length; k++) {
                temp_row.push(dataset[i][k]);
             }
             snapshot.push(temp_row);
        }
        return snapshot
    }
    //first snapshot created here
    var reset = getSnapShot();
    var snap = getSnapShot();
    //reset will remain constant and be used in the checkbox 1
    //snap will be changing and determines the color of charts when transitioning






    //_____________________Div Making_________________________//

    // Level 1: create one div and svg (based on the item_name and where the div should go)
    function createDiv(string,place) {
        mydiv = d3.select(place).append("div").attr('id','div_'+string);
        svg_div = mydiv.append("div").attr('id','svg_div_'+string).attr('position','relative').attr("float", "left").attr("width", "100%");
        mysvg = svg_div.append("svg").attr('id',string).attr("transform", "translate(20, 0)");

        //Item name of each div
        mysvg.selectAll("text")
        .data([string])
        .enter()
        .append('text')
        .text(function(d){
        return d;
        })
        .attr("y",function(d,i){
        return 35;
        })
        .attr("x", function(d,i){
            return 50;
        })
        .attr("id","text_"+string)
        .attr("class","title")
        .attr("font-size",20)
        .attr("font-family","arial")
        .attr("text-anchor","start")
        .attr("font-weight","bold")
        .style("fill","#ddd");
    }

    // Level 2: create an array of divs (based on a list of item names and a destination)
    function createDivs(list,place) {
        for (let i = 0; i < list.length; i++) {
            createDiv(list[i],place);
        }
    }

    // Level 3: Initialize the divs (create arrays of divs in two destinations and hide the sub-layer ones)
    function initializeDivs(){
        createDivs(list_of_dependent_items,'#left');
        createDivs(list_of_variable_items,'#right');
        // temporarily hide those sub-items
        toggleDivsDisplay(list_of_variable_items);
    }
    initializeDivs();


    //_____________________Slider Making_________________________//

    function initializeSlider(){
        //____Create the Slider__//
        for (let i = 0; i < list_of_variable_items.length; i++) {
               let item = list_of_variable_items[i];
               var div = document.getElementById('div_'+item)
               //create sliders for all divs that exist && don't have a slider already
               if (div!=null && div.lastElementChild.nodeName!='INPUT'){
                   let offsets = document.getElementById('div_'+item).getBoundingClientRect();
                   let slider = d3.select('#div_'+item).append('input').attr('type','range').attr('class','slider')
                   .attr('id',item+'_slider').attr('min','0.001').attr('max','100').attr('value','50')
                   .attr('position','absolute');
               }
            }
        //____Functionalize the Slider__//
        for (let i = 0; i < list_of_variable_items.length; i++) {
            let item = list_of_variable_items[i];
            let slider_name = item+'_slider';
            let slider = document.getElementById(slider_name);
            if (slider!=null){
                slider.oninput = function() {
                    var ratio = 0.75+this.value/200; // this equation allows for (-25% to 25%) change
                    var ratio_list = new Array(dataset[0].length);//create an array of multipliers
                    ratio_list.fill(ratio);
                    var item2change =  slider.id.split('_').shift();
                    var index = items_index[item2change];
                    dataset[index] = calculateTwoData('*',0,0,base_data[index],ratio_list);//direct calculation with two arrays
                    console.log(item2change+' is changing');
                    updateCalculation();
                    //compare new data with old data snapshot, happening inside updateBarCharts, determine red or green
                    updateBarCharts();
                    //and get a new one once everyone is settled down again
                    snap = getSnapShot();

                }
            }
        }
    }
    initializeSlider();



    //___________________ Scale Making_______________________//

    var H = 90; //can be modified later, determines the height of the graph
    var scale_functions =  [];
    var reverse_scale_functions =  [];
    //for style position manipulations (top->bottom)(small->big)
    function createScale(dataList,height = H){
        var max = dataList.reduce(function(a, b) {
            return Math.max(a, b);
        });
        return d3.scaleLinear().domain([0, 2*max]).range([0, height]);
    }
    //for creating y axis (bottom->up)(small->big)
    function createReverseScale(dataList,height = H){
        var max = dataList.reduce(function(a, b) {
            return Math.max(a, b);
        });
        return d3.scaleLinear().domain([0, 2*max]).range([height, 0]);
    }
    //Push all the scales into two lists to use later
    for (let i = 0; i < list_of_main_items.length; i++) {
            scale_functions.push(createScale(dataset[i]));
    }
    for (let i = 0; i < list_of_main_items.length; i++) {
            reverse_scale_functions.push(createReverseScale(dataset[i]));
    }


    //___________________ Graph Making_______________________//
    // Create Bar Chart
    function createBarChart(i){
        item_data = dataset[i];
        var svg = d3.select("#"+list_of_main_items[i]);
        svg.selectAll("g").data(item_data).enter().append("g").attr('transform', (d,i)=>`translate(${60+(i) * 40},0)`)
        .append('rect').attr('value',(d,i)=>i);
        //append rects to represent the data
        svg.selectAll("g").data(item_data).select("rect")
        .style('y', d=> H-scale_functions[i](d))
        .style('height', d=>scale_functions[i](d))
        .style('width', "30px")
        .style("fill", function(d) {
            return (d>0)?  "rgb(0, 0, " + Math.round(scale_functions[i](d) * 5) + ")" : "rgb(" + Math.round(scale_functions[i](d) * 5) + ", 0, 0)" ;
       });
        //create customized axis for each bar charts
        var yaxis = d3.axisLeft(reverse_scale_functions[i]).ticks(4).tickSize(-250);
        var axes = svg.append("g").attr("class", "axes");
        axes.append("g")
            .attr("class", "yaxis")
            .attr("transform", "translate(40, 0)")
            .call(yaxis);
    }
    function createBarCharts(){
        for (let i = 0; i < list_of_main_items.length; i++) {
            createBarChart(i);
        }
    }
    createBarCharts();

    // Utility function for style positin manipulations
    function re_px(number){
        return (String(number)+'px')
    }

    // Update Bar Charts
    function updateBarChart(i){
        item_data = dataset[i];
        d3.select("#"+list_of_main_items[i]).selectAll("g").data(item_data).enter().append("g").attr('transform', (d,i)=>`translate(${(i) * 50},0)`)
        .append('rect');

        d3.select("#"+list_of_main_items[i]).selectAll("g").data(item_data).select("rect")
        .style("fill", function(d,k) {
            // snap is the snapshot of the dataset taken during the last update
            if(d<snap[i][k]){
                return 'red' // the affected graph turn red for 0.1 second to indicate it's decreasing
            } else if (d>snap[i][k]) {
                return 'green' // turn green when increasing
            } else {
                return  "rgb(0, 0, " + Math.round(scale_functions[i](d) * 5) + ")"
                // remain gradient blue when remaining constant
            }
        })
        .transition()
        .duration(800)
        .delay(100)
        .style('y', d=> H-scale_functions[i](d))
        .style('height', d=>re_px(scale_functions[i](d)))//re-add px is necessary here
        .style('width', "30px")
        .style("fill", function(d) {
            // the final state of the charts is gradient blue
            return "rgb(0, 0, " + Math.round(scale_functions[i](d) * 5) + ")";
       });
    }
    function updateBarCharts(){
        for (let i = 0; i < list_of_main_items.length; i++) {
            updateBarChart(i);
        }
    }





    // fancy_hover_effect for titles to show the relations
    for (let i = 0; i < list_of_main_items.length; i++) {
        if (document.getElementById('div_'+list_of_main_items[i])!=null){
            relationEffect(list_of_main_items[i]);
        }
    }

    // fancy_hover_and_click_effect, override the relational if needed
    var textsClickable = Object.keys(item_grouping);
    for (let i = 0; i < textsClickable.length; i++) {
        expandableEffect(textsClickable[i]);
    }


    //checkbox 1
    function resetChanges(cb){
        dataset = reset;
        updateBarCharts();
        cb.checked = false;
    }
    //checkbox 2
    var Two_area_mode = false;
    function checkBoxHandle(cb) {
        console.log('cb.checked: '+cb.checked);
        //clear the area for a new mode
        var rightArea = document.querySelector('#right');
        if (rightArea.firstChild!=null){
            while (rightArea.firstChild) {
                rightArea.removeChild(rightArea.firstChild);
            }
        }
        d3.select('#right').append("div").attr('id','up');
        d3.select('#right').append("div").attr('id','middle');
        d3.select('#right').append("div").attr('id','bottom');
        if (Two_area_mode){
            createDivs(list_of_variable_items,'#right');
            // temporarily hide those sub-items on the right
            toggleDivsDisplay(list_of_variable_items);
            for (let i = 0; i < list_of_main_items.length; i++) {
                createBarChart(i);
            }
            initializeSlider();
        }
        Two_area_mode = cb.checked;
    }

    //checkbox 3
    Enable_pie_tool = false;
    function checkBoxPieTool(cb) {
        Enable_pie_tool = cb.checked;
        console.log('Pie tool enabled!')
        if (Enable_pie_tool == false){
            var pieArea = document.querySelector('#pie');
            //auto clear the pie area when launched and closed
            while (pieArea.firstChild) {
                pieArea.removeChild(pieArea.firstChild);
            }
            data = [];
        }
    }

    //___________________Pie Making ___________________//

    // Pie Data Picker
    //  *** Fetching data and send the data in structure, so that pie can use [by me]
    window.addEventListener('dblclick', function(event) {
        if (Enable_pie_tool){
            var el = event.target;
            var label = el.parentNode.parentNode.id;
            var which = d3.select(el).attr("value");
            var quantity = dataset[items_index[label]][which];
            //maximum kinds of visualized data in a pie: three
            if (data.length <= 3){
                data.push({label:label,quantity:quantity});
            }
            drawPie();
        }
    });

    // The Codes for PIE Chart is adapted from the work by Mike Bostock: https://bl.ocks.org/mbostock/3887235
    // Originally for accepting CSV data, I added in the part to receive data from the user input
    // Also make it updateable and change as new inputs are added (by clearing first and recreating)

    //_________Preparing  the pie_________//
    var data = [];//selected data for pie chart
    var svg = d3.select("#pie_svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    radius = Math.min(width, height) / 2,
    g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // *** customized color scheme done [by me]
    var color = d3.scaleOrdinal(["#ccddff", "#aabbff", "#8899ff", "#6677ff"]);

    function drawPie(){
        var pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.quantity; });

        var path = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var label = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        // *** clear first and recreate, so as to update not overlap [by me]
        var arc = g.selectAll(".arc").remove();
        var arc = g.selectAll(".arc")
                    .data(pie(data))
                    .enter().append("g")
                    .attr("class", "arc");

              arc.append("path")
                  .attr("d", path)
                  .attr("fill", function(d) { return color(d.data.label); });
              arc.append("text")
                  .style("font-size", "15px")
                  .style("font-weight","bold")
                  .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
                  .text(function(d) { return d.data.label; });
              // *** added addtional data display [by me]
              arc.append("text")
                  .style("font-size", "12px")
                  .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
                  .attr('dy', 15)
                  .text(function(d) { return d.data.quantity; });
    }


        // Failed to add the little info bar,
    //for further improvements
//     window.addEventListener('mouseover', function(event) {
//         var el = event.target;
//      if(el.nodeName == 'rect'){
//          var label = el.parentNode.parentNode.id;
//          var which = d3.select(el).attr("value");
//          var quantity = dataset[items_index[label]][which];

//          var x = el.getBoundingClientRect().x;
//          var y = el.getBoundingClientRect().y;
//          console.log('x,y,h: '+x+','+y);

//          d3.select(el.parentNode).append("text")
//          .attr("x", x)
//          .attr("y", y)
//          .attr("dy", "-0.35em")
//          .attr('class','info')
//          .text(quantity);
//      }
//     });
//     window.addEventListener('mouseout', function(event) {
//      d3.selectAll('.info').remove();
//     });
