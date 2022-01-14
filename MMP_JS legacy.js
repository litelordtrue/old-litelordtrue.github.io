// functions to operate checkboxes
function handleCheckbox(classname, checkboxname) {
  let checkBox = document.getElementById(checkboxname);
  var entityList = d3.selectAll("." + classname);

  if (checkBox.checked == false){
    entityList.classed("hide", true);
  } else {
    entityList.classed("hide", false);
  }
}
//

// for outputting dates nicely
function yearToDate(year){
  return parseTime(year + "-01-01");
}


const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function DateToNice(date){
  year = date.getFullYear();
  month = months[date.getMonth()];
  day = date.getDate();
  return (month + " " + day + ", " + year);
}
//


// tools to handle zoom buttons
resolutionDict = 
  [{
    value: "0",
    text: "5 Years",
    height: .2
  },
  {
    value: "1",
    text: "1 Year",
    height: 1
  },
  {
    value: "2",
    text: "6 Months",
    height: 2
  },
  {
    value: "3",
    text: "1 Quarter",
    height: 4
  }]

function handleSliderInput(){
  let slider = document.getElementById("zoomRange");
  let span = document.getElementById("resolutionText");
  let resolution = resolutionDict[slider.value];
  span.innerText = resolution.text;
  handleResolutionChange(resolution.height);
}

function handleResetInput(){
  ResetPan();
}

function handleDomainInput(){
  let input_box = document.getElementById("domainInput");
  let input = input_box.value;
  let year_array = input.split(",");
  let new_min = yearToDate(year_array[0]);
  let new_max = yearToDate(year_array[1]);

  handleDomainChange(new_min, new_max);
  input_box.placeholder = input; // sets "grey" text in background
}
//

// zooming
function ResetPan(){
  zoom.transform(svg, d3.zoomIdentity);
}

function handleResolutionChange(ratio){
  h = ratio * default_height;
  tScale.range([padding, h-padding]);
  params_obj.set('ratio', ratio); // set ratio in search params
  handleURLManip();
  updateChart();
}

function handleDomainChange(min, max){ // this works but sort of messes up things. stuff to iron out
  tScale.domain([min, max]);
  params_obj.set('domain', [min.getFullYear(), max.getFullYear()]); // set domain in search params as years
  handleURLManip();
  updateChart();
}
//

// functions for URL manip

function handleURLManip(){
  url_obj.search = params_obj; // this sets the search in the url object to what we modified in our parameter object
  history.replaceState(null, '', url_obj.pathname + url_obj.search); // this just changes the url without actually loading it
}


// functions for mmpgroups
function handleMMPGroupMouseOver (group_data) {
  let group_g = document.getElementById(group_data.id);
  let group_rect = group_g.children[0]; // this is sort of cheaty, but it works
  d3.select(group_rect).style("opacity", .9).style("fill", "mediumslateblue");

  // this generates an array of the line elements that connect to this group. 
  let link_obj_list = [];
  for (link_num = 0; link_num < group_data.links.length; link_num++){
    link_obj_list.push(document.getElementById(group_data.links[link_num]));
  }
  // console.log(link_obj_list);
  
};

function handleMMPGroupMouseOut (group_data) {
  let group_g = document.getElementById(group_data.id);
  let group_rect = group_g.children[0]; // this is sort of cheaty, but it works
  d3.select(group_rect).style("opacity", .7).style("fill", "ghostwhite");
}; 
//

// function for clicking for more info
function handleClick(type, id){
  var clicked_data, clicked_type, name, description, date;

  // handle event click
  if (type === "event") {
    clicked_data = processed_data.events.find(element => element.id === id);
    clicked_type = clicked_data.type;
    name = clicked_data.name;
    description = clicked_data.description;
    date = clicked_data.date;
  }
  // handle group click
  else if (type === "mmpgroup") {
    clicked_data = processed_data.mmpgroups.find(element => element.id === id);
    clicked_type = "mmpgroup";
    name = clicked_data.name;
    description = clicked_data.description;
    date = clicked_data.startdate;
    
  }
  // handle relationship click
  else if (type === "relationship") {
    relationship_dict = {spl: "Split", all: "Allies", riv: "Rivals"};
    clicked_data = processed_data.relationships.find(element => element.id === id);
    clicked_type = "relationship";
    group1_data = processed_data.mmpgroups.find(element => element.id === clicked_data.group1);
    group2_data = processed_data.mmpgroups.find(element => element.id === clicked_data.group2);
    name = "" + group1_data.abbr + " and " + group2_data.abbr + " " + relationship_dict[clicked_data.relationship_type];
    description = clicked_data.description;
    date = clicked_data.date;
  }

  // grab divs to put information in
  const name_span = document.getElementById('name_span');
  const date_span = document.getElementById('date_span');
  const description_span = document.getElementById('description_span');
  const description_box = document.getElementById('description_div');

  name_span.innerText = name;
  date_span.innerText = DateToNice(date);

  description_span.innerText = description;

  description_box.setAttribute("class", clicked_type + "_description");

  params_obj.set('click', [type, id]);
  handleURLManip();

  // console.log(document.getElementById('#' + id));
  svg.selectAll('.clicked').classed('clicked', false);
}


// this function draws everything in
function updateChart(){
  d3.select('#main_g').remove(); // delete the entire g
  var main_g = svg.append('g').attr("id", "main_g"); // recreate it

  var tAxis = d3.axisLeft(tScale).ticks(Math.ceil(h/svg_h)*12); //so there is ~12 ticks in the svg at any point

  main_g.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(" + padding + ",0)") // something needs to be done about this, some words are getting cut off
  .call(tAxis);

  zoom.translateExtent([[0,0], [w,h]]); // making sure you can only translate within bounds


  var rectWidth = w/(processed_data.mmpgroups.length + 1);
  var rectHeight = 100; // should probably scale these...


  // fixing y and x for mmpgroups
  for (i = 0; i < processed_data.mmpgroups.length; i++){
    let mmpgroup = processed_data.mmpgroups[i];
    mmpgroup.updatePos(rectHeight);
  };


  // make mmpgroup g element to append rectangle and text
  var mmpgroups = main_g.selectAll("mmpgroup")
  .data(processed_data.mmpgroups)
  .enter()
  .append("g")
  .attr("class", function(d){
    if (!d.active){return "mmpgroup inactive"}
    else if (d.active){return "mmpgroup active"}
    else {return "mmpgroup"};
  })
  .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"}) // transform instead of using x/y
  .attr("id", function(d){ return d.id})
  .attr("width", rectWidth)
  .attr("height", rectHeight);

  // make mmpgroup rectangles
  var mmpgroupRect = mmpgroups
  .data(processed_data.mmpgroups)
  .append("rect")
  .attr("x", -rectWidth/2)
  .attr("y", -rectHeight/2)
  .attr("width", rectWidth)
  .attr("height", rectHeight)
  .attr("rx", rectWidth/20)
  .on("mouseover", function(d,i){handleMMPGroupMouseOver(i)}) // passing all group data into these functions. should be more efficient?
  .on("mouseout", function(d,i){handleMMPGroupMouseOut(i)})
  .on("click", function(d,i){handleClick("mmpgroup", i.id)});

  var mmpgroupText = mmpgroups
  .data(processed_data.mmpgroups)
  .append("text")
  .text(function(d){return d.abbr})
  .attr("y", -rectHeight/4)
  .attr("dominant-baseline", "middle")
  .attr("text-anchor", "middle");

  var mmpgroupVLines = mmpgroups
  .data(processed_data.mmpgroups)
  .append("line")
  .attr("x1", 0)
  .attr("y1", rectHeight/2)
  .attr("x2", 0)
  .attr("y2", function(d){return h - d.y}) // since the origin is the actual mmpgroup position!
  .attr("class", "timeline")
  .attr("id", function(d) {return d.id + "_timeline"});
  // mmpgroups set up!

  // fixing event position
  for (i = 0; i < processed_data.events.length; i++){
      let event = processed_data.events[i];
      event.updatePos();
  };


  // drawing events
  /* for (i = 0; i < processed_data.mmpgroups.length; i++){ // why not do this when constructing the dataset? it makes to store array of events within the objects
    mmpgroup = processed_data.mmpgroups[i];
    event_list = processed_data.events.filter(element => element.parent_id === mmpgroup.id);
  }; */

  var events = main_g.selectAll("event") // want these 
  .data(processed_data.events)
  .enter()
  .append("circle")
  .attr("class", function(d) {return d.type})
  .attr("cx", function(d) {return d.x})
  .attr("cy", function(d) {return d.y})
  .attr("id", function(d) {return d.id})
  .attr("r", 6)
  .on("click", function(d, i){
    handleClick("event", i.id)
  });



  // fixing y and x position for relationships

  for (i=0; i<processed_data.relationships.length; i++){
      let relationship = processed_data.relationships[i];
      relationship.updatePos();
  }

  // drawing in relationships
  var relationships = main_g.selectAll("relationship")
  .data(processed_data.relationships).enter()
  .append("g")
  .attr("class", function(d){return d.relationship_type})
  .attr("transform", function(d) {return "translate(" + d.x1 + "," + d.y + ")"})
  .attr("width", function(d){return d.x2 - d.x1;})
  .attr("id", function(d){return d.id;});

  // relationship lines
  relationships.data(processed_data.relationships)
  .append("line")
  .attr("x1", 0)
  .attr("x2", function(d) {return d.x2 - d.x1;})
  .attr("y1", 0)
  .attr("y2", 0);

  // relationship endpoint circles
  // first circle
  relationships.data(processed_data.relationships)
  .append("circle")
  .attr("cx", 0)
  .attr("cy", 0)
  .attr("r", 2.5)
  // second circle
  relationships.data(processed_data.relationships)
  .append("circle")
  .attr("cx", function(d){return d.x2 - d.x1})
  .attr("cy", 0)
  .attr("r", 2.5);

  // relationship clickable circles
  relationships.data(processed_data.relationships)
  .append("circle")
  .attr("cx", function(d){return .5*(d.x2-d.x1);})
  .attr("cy", 0)
  .attr("r", 5)
  .on("click", function(d, i){
    handleClick("relationship", i.id)
  });

}
//

// function that initializes webpage

const url_obj = new URL(document.URL); // makes a url object
const params_obj = new URLSearchParams(url_obj.search);

var ratio_param = params_obj.get('ratio'); // split into individual variables
if (ratio_param){
    ratio_param = parseFloat(ratio_param);
    let slider = document.getElementById("zoomRange");
    let span = document.getElementById("resolutionText");
    let resolution = resolutionDict.find(element => element.height === ratio_param);
    slider.value = resolution.value;
    span.innerText = resolution.text;
}
else{ratio_param = 1};
var domain_param = params_obj.get('domain'); // ''
// if (domain_param){domain_param = domain_param.split(',')};
var click_param = params_obj.get('click'); // ''
// moving the div over to replicate real webpage, still not great because its absolute positioning :
var width_ratio = .7;

var working_div = document.getElementById("main_timeline");

// setting up a workspace
var w = width_ratio * window.screen.width;
var svg_h = 500;
const default_height = 1500;
var h = ratio_param * default_height; // this no longer sets the height of the svg, but rather the height of the elements within it!
var padding = 50;
var radius = 15;

var svg = d3.select("#main_timeline").append("svg").attr("id", "svg")
.attr("height", svg_h).attr("width", w)
.attr("style", "outline: thin solid red");

var main_g = svg.append('g').attr("id", "main_g");

function handleZoom(e) {
    d3.select('#main_g').attr("transform", e.transform);
}

let zoom = d3.zoom()
.on('zoom', handleZoom)
.scaleExtent([1,1]) // disables zoom
.translateExtent([[0,0], [w,h]]); // keeps panning within bounds

d3.select('svg').call(zoom);


var todays_date = new Date();
var todays_year = todays_date.getFullYear();
var parseTime = d3.timeParse("%Y-%m-%d");

// creating the (currently) empty dataset
var processed_data = {
    mmpgroups: [],
    events: [],
    relationships: [],
};

function handleD3JSONRead(input_data){
  // reading groups and events
  let data = input_data;
  for (i=0; i< data.groups.length; i++){
    let group = data.groups[i].Group;
    processed_data.mmpgroups.push(new group_class(
        group.id, group.name, group.shortname,
        parseTime(group.startdate), parseTime(group.enddate),
        group.active,
        0, 0,
        group.description, []
    ))

    let attack_list = data.groups[i].Attack;
    if (attack_list.length != 0) {for (j=0; j < attack_list.length; j++){
        let attack = attack_list[j];
        if (attack.date === undefined){attack.date = attack.startdate;} // bad data, fixing it
        if (attack.date.endsWith("00-00")){attack.date = attack.date.substr(0,5) + "01-01"};

        processed_data.events.push(new event_class(
            attack.id, "attack", "Major Attack", attack.description, parseTime(attack.date), attack.group_id,
            0, 0
        ))
    }}

    let leader_list = data.groups[i].Leader;
    if (leader_list.length != 0) {for (j=0; j < leader_list.length; j++){
        let leader = leader_list[j];
        if (leader.startdate === undefined){leader.startdate = leader.date;} // bad data, fixing it
        if (leader.startdate.endsWith("00-00")){leader.startdate = leader.startdate.substr(0,5) + "01-01"};
        processed_data.events.push(new event_class(
            leader.id, "leader", "Leadership Change: " + leader.name, leader.description, parseTime(leader.startdate), leader.group_id,
            0, 0
        ))
    }}
  }

  // reading relationships
  for (i=0; i<data.links.length; i++){
      let relationship = data.links[i].Link;
      processed_data.relationships.push(new relationship_class(
          relationship.type, relationship.id, parseTime(relationship.date), relationship.description,
          relationship.group1, relationship.group2, 
          0, 0, 0
      ));

      // creating a list of connected groups for tracing
      let group1 = processed_data.mmpgroups.find(element => element.id === relationship.group1);
      let group2 = processed_data.mmpgroups.find(element => element.id === relationship.group2);
      group1.links.push(relationship.id);
      group2.links.push(relationship.id);
  }
}


function handlePageInit(datasource){
  d3.json(datasource)
  .then(function(data){
    handleD3JSONRead(data);

    // finding the minimum year
    var date_min = d3.min(processed_data.mmpgroups, function(d){
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
    for (i=0; i<2; i++){initDomainArray[i] = yearToDate(initDomainArray[i])};

    // initiate time scale
    tScale = d3.scaleTime().domain(initDomainArray).range([padding, h-padding]);

    // giving reset domain button its function

    function handleDomainReset(){
        handleDomainChange(date_min, todays_date);
        domainInput.value = defDomainValue;
        domainInput.placeholder = defDomainValue;
    }

    document.getElementById('domainReset').onclick = handleDomainReset;

    updateChart();

    // if there was a click in url, we need to have it clicked
    if (click_param){
        click_array = click_param.split(',');
        handleClick(click_array[0], click_array[1]);
    };
  })
}
