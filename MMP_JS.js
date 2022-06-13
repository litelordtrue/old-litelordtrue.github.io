// d3js library for mapping militant groups from json data  (sample url https://dev-mapping-militants.pantheonsite.io/data/map-profiles/23)
// this dataviz displays data for each group and allows user to filter data via controls in the left sidebar
// first we define functions, then we draw/update chart in <div id="main_timeline" class="main_timeline"> using function updateChart
// class objects are defined in class_definitions.js, this file is called in index.html


// hide/show groups/events/other objects with class "classname" on the map
function handleCheckbox(classname) {
  let checkBox = document.getElementById(classname + "Checkbox");
  var entityList = d3.selectAll("." + classname);

  if (checkBox.checked == false){
    entityList.classed("hide", true);
  } else {
    entityList.classed("hide", false);
  }
}
//

// outputting dates nicely
function yearToDate(year){
  return parseTime(year + "-01-01");
}

// surely there is a list of months somewhere and I don't need to create it.
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function DateToNice(date){
  let year = date.getFullYear();
  let month = months[date.getMonth()];
  let day = date.getDate();
  return (month + " " + day + ", " + year);
}
//


// tools to handle timeline resolution 
resolutionDict = 
  [{
    text: "5 Years",
    height: .2
  },
  {
    text: "1 Year",
    height: 1
  },
  {
    text: "6 Months",
    height: 2
  },
  {
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

// functions to save parameters from URL (based on user search) in url_obj

function handleURLManip(){
  url_obj.search = params_obj; // this sets the search in the url object to what we modified in our parameter object
  history.replaceState(null, '', url_obj.pathname + url_obj.search); // this just changes the url without actually loading it
}


// functions for mmp_groups
// functions for user interaction for mmp_groups
function handleMMPGroupMouseOver (group_data) {
  let group_g = document.getElementById('g' + group_data.id);
  d3.select(group_g).classed("mmpSelected", true);

  // this generates an array of the line elements that connect to this group. 
  let link_obj_list = [];

  group_data.links.relationships.forEach(element => link_obj_list.push(d3.select("#rel" + element)));
  group_data.links.groups.forEach(element => link_obj_list.push(d3.select("#g" + element)));

  link_obj_list.forEach(element => element.classed("mmpSelected", true));
};

function handleMMPGroupMouseOut (group_data) {
  let group_g = document.getElementById('g' + group_data.id);
  d3.select(group_g).classed("mmpSelected", false);

  let link_obj_list = [];

  group_data.links.relationships.forEach(element => link_obj_list.push(d3.select("#rel" + element)));
  group_data.links.groups.forEach(element => link_obj_list.push(d3.select("#g" + element)));

  link_obj_list.forEach(element => element.classed("mmpSelected", false));
}; 
//

// function for clicking for more info
function handleClick(type, clicked_data){
  var clicked_type, name, description, date;
  var displayButton, group_id;

  // handle event click
  if (type === "event") {
    clicked_type = clicked_data.type;
    name = clicked_data.name;
    description = clicked_data.description;
    date = clicked_data.date;

    group_id = clicked_data.parent_id;
    displayButton = true;
  }
  // handle group click
  else if (type === "mmpgroup") {
    clicked_type = "mmpgroup";
    name = clicked_data.name;
    description = clicked_data.description;
    date = clicked_data.startdate;

    group_id = clicked_data.id; // calls function defined immediatly below this function, sets the <a> element to correct link
    displayButton = true;
  }
  // handle relationship click
  else if (type === "relationship") {
    clicked_type = "relationship";
    group1_data = processed_data.mmp_groups[clicked_data.group1];
    group2_data = processed_data.mmp_groups[clicked_data.group2];
    name = "" + group1_data.abbr + " and " + group2_data.abbr + " " + clicked_data.relationship_type;
    description = clicked_data.description;
    date = clicked_data.date;

    group_id = -1;
    displayButton = false;
    FullProfileAnchor.classList.add('hide');
  }

  // grab divs to put information in
  const modal = document.getElementById('infoModal');
  const name_span = document.getElementById('infoModalLabel');
  const modal_date = document.getElementById('modal_date');
  const modal_description = document.getElementById('modal_description');

  name_span.innerText = name;
  modal_date.innerText = DateToNice(date);

  modal_description.innerText = description;

  setFullProfileTarget(group_id, displayButton);
}

// this function is used above to make sure the See Full Profile button inside of the modal links to the correct webpage, specific to that id
function setFullProfileTarget(id, show){
  const FullProfileAnchor = document.getElementById('FullProfileAnchor');
  FullProfileAnchor.href = "/node/" + id.toString();

  if (show){FullProfileAnchor.classList.remove('hide')}
  else if (!show){FullProfileAnchor.classList.add('hide')};
}

// function that initializes webpage

const url_obj = new URL(document.URL); // makes a url object
const params_obj = new URLSearchParams(url_obj.search);

var ratio_param = params_obj.get('ratio'); // split into individual variables
if (ratio_param){
    ratio_param = parseFloat(ratio_param);
    let slider = document.getElementById("zoomRange");
    let span = document.getElementById("resolutionText");
    let resolution = resolutionDict.find(element => element.height === ratio_param); // TO DO. FIX. this may be the most inefficient piece of code EVER written. Fix resolutionDict to actually be a dictionary, and USE IT ACCORDINGLY FFS
    slider.value = resolution.value;
    span.innerText = resolution.text;
}
else{ratio_param = 1};
var domain_param = params_obj.get('domain'); // ''
// if (domain_param){domain_param = domain_param.split(',')};
// var click_param = params_obj.get('click'); // ''
// moving the div over to replicate real webpage, still not great because its absolute positioning :
var width_ratio = .7;