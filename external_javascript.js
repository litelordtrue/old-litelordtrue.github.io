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


// functions for nodes
function handleNodeMouseOver () {
  d3.select(this).style("opacity", .9).style("fill", "mediumslateblue");
};

function handleNodeMouseOut () {
  d3.select(this).style("opacity", .7).style("fill", "ghostwhite");
}; 
//

// functions for events
//

// function for clicking for more info
function handleClick(type, id){
  var clicked_data, clicked_type, description, date;

  if (type === "event") {
    clicked_data = processed_data.events.find(element => element.id === id);
    clicked_type = clicked_data.type;
    description = clicked_data.description;
    date = clicked_data.date;
  }
  else if (type === "node") {
    clicked_data = processed_data.nodes.find(element => element.id === id);
    clicked_type = "node";
    description = clicked_data.description;
    date = clicked_data.startdate;
  };

  const date_box = document.getElementById('date_span');
  const description_span = document.getElementById('description_span');
  const description_box = document.getElementById('description_div');

  date_box.innerText = DateToNice(date);

  description_span.innerText = description;

  description_box.setAttribute("class", clicked_type + "_description");

  params_obj.set('click', [type, id]);
  handleURLManip();

  console.log(document.getElementById('#' + id));
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


  var rectWidth = w/(processed_data.nodes.length + 1);
  var rectHeight = 100; // should probably scale these...


  // fixing y and x for nodes
  for (i = 0; i < processed_data.nodes.length; i++){
    let node = processed_data.nodes[i];
    node.updatePos(rectHeight);
  };


  // make node g element to append rectangle and text
  var nodes = main_g.selectAll("node")
  .data(processed_data.nodes)
  .enter()
  .append("g")
  .attr("class", "node")
  .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"}) // transform instead of using x/y
  .attr("id", function(d){ return d.id})
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
  .on("mouseover", handleNodeMouseOver)
  .on("mouseout", handleNodeMouseOut)
  .on("click", function(d, i){
    handleClick("node", i.id)
  });

  var nodeText = nodes
  .data(processed_data.nodes)
  .append("text")
  .text(function(d){return d.abbr})
  .attr("y", -rectHeight/4)
  .attr("dominant-baseline", "middle")
  .attr("text-anchor", "middle");

  var nodeVLines = nodes
  .data(processed_data.nodes)
  .append("line")
  .attr("x1", 0)
  .attr("y1", rectHeight/2)
  .attr("x2", 0)
  .attr("y2", function(d){return h - d.y}) // since the origin is the actual node position!
  .attr("class", "timeline")
  .attr("id", function(d) {return d.id + "_timeline"});
  // nodes set up!

  // fixing event position
  for (i = 0; i < processed_data.events.length; i++){
      let event = processed_data.events[i];
      event.updatePos();
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
  .append("line")
  .attr("class", function(d){return d.relationship_type})
  .attr("y1", function(d){return d.y})
  .attr("y2", function(d){return d.y})
  .attr("x1", function(d){return d.x1})
  .attr("x2", function(d){return d.x2});
}
//