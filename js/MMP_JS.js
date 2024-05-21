// d3js library for mapping militant groups from json data  (sample url https://dev-mapping-militants.pantheonsite.io/data/map-profiles/23)
// this dataviz displays data for each group and allows user to filter data via controls in the left sidebar
// first we define functions, then we draw/update chart in <div id="main_timeline" class="main_timeline"> using function updateChart, now found in MMP_draw
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

function handleRelationshipCheckboxes(classname){
  let entityList, checkbox, checked;
  if (classname.length == 0){
    entityList = d3.select("#main_g").selectAll(".relationship");
    checkbox = document.getElementById("relationshipCheckbox");
    checked = !(checkbox.checked);
  }
  else{
    entityList = d3.select("#main_g").selectAll(".relationship." + classname);
    checkbox = d3.select("#legend_main_g").selectAll(".relationship." + classname);
    checked = !(checkbox.classed("off"));
    checkbox.classed("off", checked);
  }
  entityList.classed("hide", checked);
}

function handleGroupCheckboxes(){
  let activeCheckbox = document.getElementById('activeCheckbox');
  let inactiveCheckbox = document.getElementById('inactiveCheckbox');
  d3.select('#main_g').remove();
  let new_drawn_dataset = buildDrawnDataset(activeCheckbox.checked, inactiveCheckbox.checked);
  drawChart(new_drawn_dataset);
  handleCheckbox('attack');
  handleCheckbox('brush');
}
//

// specific tool to split up relationships in years, just helpful
function updateRelationshipClumps(relationships){
  let years = new Set();
  relationships.forEach(x => years.add(x.date.getFullYear()));
  bucketed_data = Object.fromEntries(Array.from(years).sort().map(x => [x, []]));

  for (i = 0; i < relationships.length; i++){
    let datum = relationships[i];
    let date_string = `${datum.date.getFullYear()}`;
    bucketed_data[date_string].push(datum);
  }

  for (i in bucketed_data){
    let bucket = bucketed_data[i];
    let n = bucket.length;
    for (j = 0; j < n; j++){
      let relationship = bucket[j];
      relationship.clump = j/n;
    }
  }

  return bucketed_data;
}
//

// tools to handle timeline resolution 
// deleted a bunch of this stuff. 
//

function handleDomainChange(min, max){ // this works but sort of messes up things. stuff to iron out
  tScale.domain([min, max]);
  //params_obj.set('domain', [min.getFullYear(), max.getFullYear()]); // set domain in search params as years
  //handleURLManip();
  updateChart();
}
//


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
  var displaySeeFullProfile, displayTraceGroup, group_id;

  // handle event click
  if (type === "event") {
    clicked_type = clicked_data.type;
    name = clicked_data.name;
    description = clicked_data.description;
    date = clicked_data.date;

    group_id = clicked_data.parent_id;
    displaySeeFullProfile = true;
    displayTraceGroup = false;
  }
  // handle group click
  else if (type === "mmpgroup") {
    clicked_type = "mmpgroup";
    name = clicked_data.name;
    description = clicked_data.description;
    date = clicked_data.startdate;

    group_id = clicked_data.id; // calls function defined immediatly below this function, sets the <a> element to correct link
    displaySeeFullProfile = true;
    displayTraceGroup = true;
  }
  // handle relationship click
  else if (type === "relationship") {
    clicked_type = "relationship";
    group1_data = processed_data.mmp_groups[clicked_data.group1];
    group2_data = processed_data.mmp_groups[clicked_data.group2];
    name = "" + group1_data.name + " and " + group2_data.name + " " + clicked_data.relationship_type;
    description = clicked_data.description;
    date = clicked_data.date;

    group_id = -1;
    displaySeeFullProfile = false;
    displayTraceGroup = false;
  }

  // grab divs to put information in
  const modal = document.getElementById('infoModal');
  const name_span = document.getElementById('infoModalLabel');
  const modal_date = document.getElementById('modal_date');
  const modal_description = document.getElementById('modal_description');

  name_span.innerText = name;
  modal_date.innerText = date.toLocaleDateString("US", {day: "numeric", month: "long", year: "numeric"});

  modal_description.innerText = description;

  setFullProfileTarget(group_id, displaySeeFullProfile);
  setTraceGroupTarget(group_id, displayTraceGroup);
}

// this function is used above to make sure the See Full Profile button inside of the modal links to the correct webpage, specific to that id
function setFullProfileTarget(id, show){
  const FullProfileAnchor = document.getElementById('FullProfileAnchor');
  FullProfileAnchor.href = "/node/" + id.toString();

  if (show){FullProfileAnchor.classList.remove('hide')}
  else if (!show){FullProfileAnchor.classList.add('hide')};
}

// all functions related to Tracing
function setTraceGroupTarget(id, show){
  const TraceGroupButton = document.getElementById('TraceGroup');

  TraceGroupButton.onclick = function(){TraceGroup(id)};
  if (show){TraceGroupButton.classList.remove('hide')}
  else if (!show){TraceGroupButton.classList.add('hide')};
}

function updateTracedBoolean(current_data){
  for (id in processed_data.mmp_groups){
    let group = processed_data.mmp_groups[id];
    group.traced = false;
  }
  for (id in current_data.mmp_groups){
    processed_data.mmp_groups[id].traced = true;
  }
}

function TraceGroup(id){
  d3.select('#main_g').remove();
  let traced_data = processed_data.mmp_groups[id].buildTraceDataset();
  drawChart(traced_data);
  handleCheckbox('attack');
  handleCheckbox('brush');
}

function handleDomainReset(){
  var date_min = d3.min(Object.values(processed_data.mmp_groups), function(d){
    return d.startdate;
})
  handleDomainChange(date_min, new Date());
}

function handleCancelTrace(){
  d3.select('#main_g').remove();
  handleDomainReset();
  drawChart(processed_data);
  handleCheckbox('attack');
  handleCheckbox('brush');
}

// the below functions are used to build a dataset from processed_data. 
// this dataset contains only the approved criterion: groups (active or all), events (on or off), relationships (checklist on ally, split, rival)

// homebrew filter function on objects. turns object into array, filters, then returns the new object.
Object.filter = (obj, predicate) => Object.fromEntries(Object.entries(obj).filter(predicate));

function filterRelationshipsById(id_array, relationship){
  if (id_array.includes(relationship.group1) || id_array.includes(relationship.group2)){
    return true;
  }
  else {return false;}
}

// buildDrawnDataset walks down the hierarchy. First, it selects only the groups allowed. This means it selects (active/inactive)
function buildDrawnDataset(active, inactive){
  let drawn_dataset = {
    mmp_groups: {},
    relationships: []
  };

  if (active && inactive){
    drawn_dataset.mmp_groups = processed_data.mmp_groups;
  }
  else if (active && !inactive){
    drawn_dataset.mmp_groups = Object.filter(processed_data.mmp_groups, ([id, group]) => group.active == "Active");
  }
  else if (!active && inactive){
    drawn_dataset.mmp_groups = Object.filter(processed_data.mmp_groups, ([id, group]) => group.active != "Active");
  }
  
  let ids = Object.keys(drawn_dataset.mmp_groups);

  drawn_dataset.relationships = processed_data.relationships.filter(rel => filterRelationshipsById(ids, rel));

  return drawn_dataset;
}