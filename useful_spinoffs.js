// this file is used for me to store snippets of code that modify certain functions in massive ways but are too small to get determined branches

// this reads map data. instead of modifying processed_data.mmpgroups as an array, it assumes that proccessed_data.mmpgroups
// is actually an object, and gives it the property [group_id] with the object stored under it. this causes lots of issues
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
        group.group_id, group.group_name, short_name, parseTime(group.startdate), parseTime(group.enddate), group.Active, 
        0, 0, 
        group.description, [], []
      )
    }
  }