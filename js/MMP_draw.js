// the goal of this file is to contain all of the d3 components of the MMP drawing program

// zooming
function ResetPan(){
    zoom.transform(svg, d3.zoomIdentity);
  }

// this function draws everything in
function drawChart(current_data){
    var defs = svg.select('defs'); // defs is an svg element used to store designs to be used later. For now, I will place <marker> elements in here
    var main_g = svg.append('g').attr("id", "main_g"); 
    var bottomlayer = main_g.append('g').attr("id", "bottomlayer");
    var middlelayer = main_g.append('g').attr("id", "middlelayer");
    var toplayer = main_g.append('g').attr("id", "toplayer");
    var tAxis = d3.axisLeft(tScale).ticks(Math.ceil(h/svg_h)*12); //so there is ~12 ticks in the svg at any point

    main_g.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + padding + ",0)") // something needs to be done about this, some words are getting cut off
    .call(tAxis);
  
    //zoom.translateExtent([[0,0], [w,h]]); // making sure you can only translate within bounds
  
    var groups_array = Object.values(current_data.mmp_groups);
    groups_array.sort((a,b) => (a.position > b.position) ? 1 : -1);
  
    var rectWidth = 200;
    var rectHeight = 100; // should probably scale these...

    let num_of_groups = groups_array.length;
    var w = ((num_of_groups + 1) * rectWidth) + padding;
    svg.attr("width", w);

    // fixing y and x for mmp_groups and their subsequent events
    for (i = 0; i < groups_array.length; i++){
      let mmpgroup = groups_array[i];
      mmpgroup.updatePos(rectWidth, true, i);
      mmpgroup.events.forEach(element => element.updatePos());
    };
  
  
    // make mmpgroup g element to append rectangle and text
    var mmp_groups = bottomlayer.selectAll("mmpgroup")
    .data(groups_array)
    .enter()
    .append("g")
    .attr("class", function(d){
      let active = (d.active === "Active");
      if (active){return "mmpgroup active"}
      else {return "mmpgroup inactive"}
    })
    .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"}) // transform instead of using x/y
    .attr("id", function(d){ return "g" + d.id})
    .attr("width", rectWidth)
    .attr("height", rectHeight);
  
    // make mmpgroup rectangles. Think of this more as an outline for the text, and less as THE interactable
    var mmpgroupRect = mmp_groups
    .append("rect")
    .attr("x", -rectWidth/2)
    .attr("y", -rectHeight/2)
    .attr("width", rectWidth)
    .attr("height", rectHeight)
    .attr("rx", rectWidth/20)
  
    var mmpgroupText = mmp_groups
    .append('foreignObject')
    .attr("x", -rectWidth/2)
    .attr("y", -rectHeight/(2))
    .attr("width", rectWidth)
    .attr("height", rectHeight)
    .on('mouseover', function(d, i){handleMMPGroupMouseOver(i)})
    .on("mouseout", function(d,i){handleMMPGroupMouseOut(i)})
    .on("click", function(d,i){handleClick("mmpgroup", i)})
    .attr("data-bs-toggle", "modal") 
    .attr("data-bs-target", "#infoModal")
    .append('xhtml:p')
    .html(function(d){return d.name + "<br>" + d.startdate.getFullYear()})
    .attr("pointer-events", "none");

    // create arrowhead marker in defs for Vlines
    marker_size = 15;

    defs.append("marker").attr("id", "arrow").attr("viewBox", "0 0 10 10")
    .attr("refX", 5).attr("refY", 5).attr("markerWidth", marker_size).attr("markerHeight", marker_size).attr("orient", "auto-start-reverse")
    .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z");

  
    var mmpgroupVLines = mmp_groups
    .append("polyline")
    .attr("points", function(d){return "0," + (h-d.y-marker_size) + " 0," + rectHeight/2})//TODO use .format() like in python to make this neat
    .attr("class", "timeline")
    .attr("id", function(d) {return "VLine" + d.id})
    .attr("marker-start", function(d){
        if(d.active === "Active"){return "url(#arrow)"}
        else{return null}
    });

    /*var mmpgroupHLines = mmp_groups
    .append("polyline")
    .attr("points", function(d){return "0, 0" + " " + -(d.x-50) + ",0"})
    .attr("class", "timeline");*/
    // mmp_groups set up!

    // drawing mmp_events

    // adding a path that looks like an explosion to defs so it can be called below
    const explosion_path = "M 5 -6 L 6 -10 L 2 -8 L 0 -14 L -2 -8 L -5 -10 L -4 -6 L -14 -14 L -8 -1 L -14 0 L -8 1 L -13 11 L -5 4 L -5 8 L -2 4 L 0 9 L 2 4 L 6 8 L 5 5 L 15 11 L 7 2 L 11 0 L 7 -2 L 15 -11 Z"
    defs.append("path")
    .attr("d", explosion_path)
    .attr("id", "explosion");

    /*const dictator_path = "M -4 -12 L -4 -10 C -6 -10 -8 -10 -12 -8 L -16 0 L -8 13 L -8 10 L -12 0 L -10 -4 L -10 12 C -10 16 -8 16 -8 16 L 8 16 C 8 16 10 16 10 12 L 10 -4 L 12 0 L 8 10 L 8 13 L 16 0 L 12 -8 C 8 -10 6 -10 4 -10 V -12 C 6 -16 6 -16 6 -20 C 6 -24 4 -26 0 -26 C -4 -26 -6 -24 -6 -20 C -6 -16 -6 -16 -4 -12"
    defs.append("path")
    .attr("d", dictator_path)
    .attr("id", "dictator");*/

    //running through the events of each group. nested for loop is unavoidable as far as i can tell, but it still scales linearly to the number of events
    for (id in current_data.mmp_groups){
      let group = current_data.mmp_groups[id];
      // create one empty element to fill. selectAll('foo') is a complete  cheatcode 
      var event_g = middlelayer.append('g').attr("id", "events" + group.id);
      var events = event_g.selectAll('foo').data(current_data.mmp_groups[id].events).enter();

      events.append('svg:use').attr("xlink:href", "#explosion")
        .attr("class", "attack")
        .attr("x", function(d) {return d.x})
        .attr("y", function(d) {return d.y})
        .attr("id", function(d) {return d.id})
        .attr("data-bs-toggle", "modal") 
        .attr("data-bs-target", "#infoModal")
        .on("click", function(d, i){
          handleClick("event", i)})
    } 
  
    // fixing y and x position for relationships
    current_data.relationships.forEach(element => element.updatePos());

    // adding marker to create split lines in split relationships
    /*const split_mid = "M 90 -195 L -90 195";
    defs.append("marker").attr("id", "split_mid")
    .attr("refX", 0).attr("refY", 0).attr("markerWidth", 200).attr("markerHeight", 200)
    .append("path").attr("d", split_mid).attr("stroke", "black");*/

    // drawing in relationships
    var relationships = toplayer.selectAll("relationship")
    .data(current_data.relationships).enter()
    .append("g")
    .attr("class", function(d){return "relationship " + d.relationship_type})
    .attr("transform", function(d) {return "translate(" + d.x1 + "," + d.y + ")"})
    .attr("width", function(d){return d.x2 - d.x1;})
    .attr("id", function(d){return "rel" + d.id;});
    /*.attr("data-bs-toggle", "modal") 
    .attr("data-bs-target", "#infoModal")
    .on("click", function(d, i){
        handleClick("relationship", i)
    });*/
  
    // relationship lines
    relationships.data(current_data.relationships)
    .append("path")
    .attr("d", function(d){
        let dist= d.x2 - d.x1;
        return "M 0 0 H " + dist;
    });
  
  
    // relationship endpoint circles
    // first circle
    relationships.data(current_data.relationships)
    .append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 2.5)
    // second circle
    relationships.data(current_data.relationships)
    .append("circle")
    .attr("cx", function(d){return d.x2 - d.x1})
    .attr("cy", 0)
    .attr("r", 2.5);

    // relationship clickables
    relationships.data(current_data.relationships)
    .append("circle")
    .attr("class", "clicker")
    // TODO: surely linewidth and clickerwidth do not need to be individually calculated for all of these.... should these be stored in the relationship object instead?
    .attr("cx", function(d){
      let linewidth = d.x2 - d.x1;
      return .5*linewidth;
    })
    .attr("r", function(d){
      /*let linewidth = Math.abs(d.x2 - d.x1);
      let clickerwidth =  .5 * Math.sqrt(linewidth);

      return clickerwidth;*/

      return 10;
    })
    .attr("cy", 0)
    .attr("data-bs-toggle", "modal") 
    .attr("data-bs-target", "#infoModal")
    .on("click", function(d, i){
      handleClick("relationship", i)
    });

    // TO DO FIX THIS? what is happening
    let zoomRange = document.getElementById('zoomRange');
    zoomRange.on

    // create an svg element to cancel trace that only appears when trace is active
    var cancel_trace = main_g.append("g").attr("id", "cancel_trace");
    cancel_trace.attr("transform", "translate(" + (w-100) + "," + 100 + ")").attr("width", 90).attr("height", 50);
    cancel_trace.classed("hide", (current_data == processed_data));

    cancel_trace.append('rect').attr('width', 90).attr("height", 50).attr("fill", "white").attr("stroke", "black");
    cancel_trace.append('foreignObject').attr('width', 90).attr("height", 50).append('xhtml:p').html("Restore Default Map");
    cancel_trace.on("click", handleCancelTrace);
  }
//

var working_div = document.getElementById("main_timeline");

// setting up a workspace. I predict that many many errors will come of this design.....
//var w = Object.keys(processed_data.mmp_groups).length * rectWidth; // pull the available space of the div
var svg_h = 750;
const default_height = svg_h;
var h = ratio_param * default_height; // this no longer sets the height of the svg, but rather the height of the elements within it!
var padding = 50;
var radius = 15;

var svg = d3.select("#svg")
.attr("height", svg_h)//.attr("width", w);

function handleZoom(e) {
    d3.select('#main_g').attr("transform", e.transform);
}

let zoom = d3.zoom()
.on('zoom', handleZoom)
.scaleExtent([1,1]) // disables zoom
//.translateExtent([[0,0], [w,h]]); // keeps panning within bounds

d3.select('svg').call(zoom);


var todays_date = new Date();
var todays_year = todays_date.getFullYear();
var parseTime = d3.timeParse("%Y-%m-%d");


function handlePageInit(map_id){
  
  var promise_sum = handlePageInitRead(map_id);

  promise_sum.then(function(){
    // finding the minimum year
    var date_min = d3.min(Object.values(processed_data.mmp_groups), function(d){
        return d.startdate;
    })

    let year_min = date_min.getFullYear();

    // setting up the domain input textbox
    let domainInput = document.getElementById('domainInput');
    let defDomainValue = year_min + "," + todays_year;
    var initDomainValue;
    if (domain_param){initDomainValue = domain_param}
    else {initDomainValue = defDomainValue};

    domainInput.value = initDomainValue;
    domainInput.placeholder = initDomainValue;

    initDomainArray = initDomainValue.split(',');
    for (i=0; i<2; i++){initDomainArray[i] = yearToDate(initDomainArray[i])}; // TO DO REPLACE WITH FOREACH

    // initiate time scale
    tScale = d3.scaleTime().domain(initDomainArray).range([padding, h-padding]);

    // giving reset domain button its function

    function handleDomainReset(){
        handleDomainChange(date_min, todays_date);
        domainInput.value = defDomainValue;
        domainInput.placeholder = defDomainValue;
    }

    document.getElementById('domainReset').onclick = handleDomainReset;

    drawChart(processed_data);
    handleCheckbox('attack');
    
    /* if there was a click in url, we need to have it clicked
    if (click_param){
        click_array = click_param.split(',');
        handleClick(click_array[0], click_array[1]);
    }; */
  })
}

// function updateChart will now initiate many d3.transition()  on  different elements

function updateChart(){
    groups_array = Object.values(processed_data.mmp_groups).filter(element => element.traced);

    let num_of_groups = groups_array.length;

    var rectHeight = 100; // should probably scale these...
    var rectWidth = 200;

    // update all positions
    for (i = 0; i < groups_array.length; i++){
        let mmpgroup = groups_array[i];
        mmpgroup.updatePos(rectWidth, false);
        mmpgroup.events.forEach(element => element.updatePos());
    };

    //ResetPan();
    
    processed_data.relationships.forEach(element => element.updatePos());
    //

    // move mmp groups to the correct origin
    d3.selectAll(".mmpgroup").transition().duration(500).attr("transform", function(d){return "translate(" + d.x + "," + d.y +")"});
    // extend and retract the downward facing lines from group
    d3.selectAll(".timeline").transition().duration(500).attr("points", function(d){return "0," + (h-d.y-marker_size) + " 0," + rectHeight/2});
    // move attacks to the correct (cx,cy)
    d3.selectAll(".attack").transition().duration(500).attr("x", function(d){return d.x}).attr("y", function(d){return d.y});
    // move relationships up and down
    d3.selectAll(".relationship").transition().duration(500).attr("transform",function(d){return "translate(" + d.x1 + "," + d.y + ")"});

    // in order to properly transition an axis g object, the d3 axisLeft() must be recreated, since it pulls the construction from this directly. 
    var tAxis = d3.axisLeft().scale(tScale).ticks(Math.ceil(h/svg_h)*12);
    d3.select(".axis").transition().duration(500).call(tAxis);

    //zoom.translateExtent([[0,0], [w,h]]); // keeps panning within bounds
    d3.select('svg').call(zoom);
}