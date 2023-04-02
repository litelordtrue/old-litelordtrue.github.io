// this file is designated specifically for writing code related to reading the raw json data and porting into the "local" processed_data object

// creating the (currently) empty dataset
var processed_data = {
    mmp_groups: {},
    relationships: []
};

function handleMapJSONRead(input_data){
    // reading groups (and attacks eventually)
    for (i=0; i<input_data.mmp_groups.length; i++){
      var group = input_data.mmp_groups[i].mmp_group;
      let short_name;
      if(!group.short_name){
        short_name = group.group_name.substring(0,5);
      }
      else{short_name = group.short_name}; // fixing bad data; only one actually has a short_name right now
  
      processed_data.mmp_groups[group.group_id] = new mmp_group(
        group.group_id, group.group_name, short_name, parseTime(group.startdate), parseTime(group.enddate), 
        group.Active, group.description)
    }
  }

function handleMapOrderJSONRead(input_data){
  let order_str = input_data.nodes[0].node.profiles_order;
  order_array = order_str.split(", ").map(x => Number(x)) 
  order_array = order_array.filter(id => processed_data.mmp_groups[id] != NaN);
  for (i=0; i < order_array.length; i++){
    let id = order_array[i];
    processed_data.mmp_groups[id].position = i;
  }
};


function handleRelationshipJSONRead(input_data){

    for(k=0;k<input_data.relationships.length;k++){
      let r = input_data.relationships[k].relationship;
      let r_groups = r.groups.split(", ").sort();

      processed_data.relationships.push(new mmp_relationship(r.type, r.relationship_id, 
        parseTime(r.startdate), r.description, r_groups[0], r_groups[1]));
    }

    processed_data.relationships.forEach(element => element.updateAdjoiningGroups());
  }



function handlePageInitRead(map_id){

    // read map-profiles data
    let map_source = "/data/map-profiles/" + map_id;
    //let map_source = "https://live-mapping-militants.pantheonsite.io/data/map-profiles/23";
    var map_promise = d3.json(map_source);


    map_promise.then(function(data){ // imports groups data from map-profiles/[ fill in MAP_ID here ]
      handleMapJSONRead(data);
    });
    //

    // read map data, gives us order of groups
    let map_order_source = "/data/map-profiles-order/" + map_id;
    var map_order_promise = d3.json(map_order_source);

    map_order_promise.then(function(data){
      handleMapOrderJSONRead(data)
    });
    //
  
    // read relationships data. currently, if there is no relationships file, the map will not be drawn in. 
    let relationships_source = "/data/relationships/" + map_id;
    var relationship_promise = d3.json(relationships_source).then(function(data){
      handleRelationshipJSONRead(data);
    })
    //
  
    // read events data
    var events_promise = map_promise.then(function(){ // must happen after maps are read
      var events_array = []; // create an array to store promises for each group read
      for (i=0; i<Object.values(processed_data.mmp_groups).length; i++){ 
        let group = Object.values(processed_data.mmp_groups)[i];
  
        let promise = d3.json("/data/attack-profiles/" + group.id)
        .then(function(data){ // push the promise returned by d3.json
          group.importAttacks(data);
        })
  
        events_array.push(promise);
      }
      return(events_array); // send up the array of all promises
    }).then(function(d){return Promise.allSettled(d)}); // finally, once all of these promises are settled (whether with or without failure), we send up a promise to represent this completion
  
    return Promise.all([map_promise, map_order_promise, relationship_promise, events_promise]);
  }