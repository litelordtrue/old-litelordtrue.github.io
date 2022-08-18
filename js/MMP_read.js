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


function handleRelationshipJSONRead(input_data){

    for(k=0;k<input_data.relationships.length;k++){
      let r = input_data.relationships[k].relationship;
      let r_groups = r.groups.split(", ").sort();

      processed_data.relationships.push(new mmp_relationship(r.type, r.relationship_id, 
        parseTime(r.startdate), r.description, r_groups[0], r_groups[1]));
    }

    processed_data.relationships.forEach(element => element.updateAdjoiningGroups());
  }
