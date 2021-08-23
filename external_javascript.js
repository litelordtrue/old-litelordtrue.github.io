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
  updateChart();
}

function handleDomainChange(min, max){ // this works but sort of messes up things. stuff to iron out
  tScale.domain([min, max]);
  updateChart();
}
//


// functions for nodes
function handleNodeMouseOver () {
  d3.select(this).attr("opacity", .9).attr("fill", "mediumslateblue");
};

function handleNodeMouseOut () {
  d3.select(this).attr("opacity", .7).attr("fill", "ghostwhite");
}; 

function handleNodeClick(){ // this needs to do more than console.log, it needs to be a popup
  let node = processed_data.nodes.find(element => element.id === this.id);
  let description = node.description;
  let date = node.startdate;

  const date_box = document.getElementById('date_span');
  const description_span = document.getElementById('description_span');
  const description_box = document.getElementById('description_div');

  date_box.innerText = DateToNice(date);

  description_span.innerText = description;

  description_box.setAttribute("class", "node_description");
};
//


// functions for events
function handleEventClick () { 
  let event = processed_data.events.find(element => element.id === this.id);
  let event_type = event.type;
  let description = event.description;
  let date = event.date;

  const date_box = document.getElementById('date_span');
  const description_span = document.getElementById('description_span');
  const description_box = document.getElementById('description_div');

  date_box.innerText = DateToNice(date);

  description_span.innerText = description;

  description_box.setAttribute("class", event_type + "_description");
}
//

// this function draws everything in
function updateChart(){
  d3.select('#main_g').remove(); // delete the entire g
  var main_g = svg.append('g').attr("id", "main_g"); // recreate it

  var tAxis = d3.axisLeft(tScale).ticks(Math.ceil(h/500)*12); //so there is ~12 ticks in the svg at any point

  main_g.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(" + padding + ",0)") // something needs to be done about this, some words are getting cut off
  .call(tAxis);

  zoom.translateExtent([[0,0], [w,h]]); // making sure you can only translate within bounds
  var current_min = tScale.domain()[0]; // finding current minimum year
  var current_max = tScale.domain()[1]; // finding current maximum year

  var rectWidth = w/(processed_data.nodes.length + 1);
  var rectHeight = 100; // should probably scale these...


  // fixing y and x for nodes

  for (i = 0; i < processed_data.nodes.length; i++){
    let node = processed_data.nodes[i];
      if(node.startdate >= current_min && node.startdate <= current_max) { // inside tScale domain
        node.y = tScale(node.startdate);
      }
      else if (node.startdate < current_min) { // if it happened earlier, put it on top. TODO: make it note somewhere that it is further up, so that it can look different
        node.y = rectHeight/2 + 1; // add one to avoid trailing garbage error, pretty silly
      }
      else if (node.startdate > current_max){
        console.log(node.abbr + ", far down");
      }
      node.x = (i+1) * (w/(processed_data.nodes.length+1));
  };


  // make node g element to append rectangle and text

  var nodes = main_g.selectAll("node")
  .data(processed_data.nodes)
  .enter()
  .append("g")
  .attr("class", "node")
  .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"}) // transform instead of using x/y
  .attr("width", rectWidth)
  .attr("height", rectHeight);

  // make node rectangles
  var nodeRect = nodes
  .data(processed_data.nodes)
  .append("rect")
  .attr("x", -rectWidth/2)
  .attr("y", -rectHeight/2)
  .attr("width", rectWidth)
  .attr("height", rectHeight)
  .attr("rx", rectWidth/20)
  .attr("opacity", .7)
  .attr("id", function(d){ return d.id})
  .attr("fill", "ghostwhite")
  .attr("stroke", "black")
  .on("mouseover", handleNodeMouseOver)
  .on("mouseout", handleNodeMouseOut)
  .on("click", handleNodeClick);

  var nodeText = nodes
  .data(processed_data.nodes)
  .append("text")
  .text(function(d){return d.abbr});

  

  var nodeVLines = nodes
  .data(processed_data.nodes)
  .append("line")
  .attr("x1", 0)
  .attr("x2", 0)
  .attr("y1", rectHeight/2)
  .attr("y2", function(d){return h - d.y}) // since the origin is the actual node position!
  .attr("class", "timeline")
  .attr("id", function(d) {return d.id + "_timeline"});
  // nodes set up!

  // fixing event position
  for (i = 0; i < processed_data.events.length; i++){
      let event = processed_data.events[i];
      // y position
      event.y = tScale(event.date);
      // x position
      event.x = processed_data.nodes.find(element => element.id === event.parent_id).x;
  };


  // drawing events
  var events = main_g.selectAll("attack")
  .data(processed_data.events)
  .enter()
  .append("circle")
  .attr("class", function(d) {return d.type})
  .attr("cx", function(d) {return d.x})
  .attr("cy", function(d) {return d.y})
  .attr("id", function(d) {return d.id})
  .attr("r", 5)
  .on("click", handleEventClick);


  // fixing y and x position for relationships

  for (i=0; i<processed_data.relationships.length; i++){
      let relationship = processed_data.relationships[i];
      relationship.y = tScale(relationship.date);
      relationship.x1 = processed_data.nodes.find(element => relationship.group1 === element.id).x;
      relationship.x2 = processed_data.nodes.find(element => relationship.group2 === element.id).x;
  }

  // drawing in relationships

  var relationships = main_g.selectAll("relationship")
  .data(processed_data.relationships).enter()
  .append("line")
  .attr("class", function(d){return d.relationship_type})
  .attr("y1", function(d){return d.y})
  .attr("y2", function(d){return d.y})
  .attr("x1", function(d){return d.x1})
  .attr("x2", function(d){return d.x2});
}
//