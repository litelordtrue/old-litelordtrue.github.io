class mmp_group {
    constructor(id, name, abbr, startdate, enddate, active, description, position) {
        this.id = id;
        this.name = name;
        this.abbr = abbr;
        this.startdate = startdate;
        this.enddate = enddate;
        this.active = active;
        this.traced = true;
        this.x = 0;
        this.y = 0;
        this.description = description;
        this.position = 0;
        this.events = [];
        this.links = {relationships: [], groups: new Set()};
    }

    updatePos(rectW, updatex, i = undefined){
        var current_min = tScale.domain()[0]; // finding current minimum year
        var current_max = tScale.domain()[1]; // finding current maximum year
        if(this.startdate >= current_min && this.startdate <= current_max) { // inside tScale domain
            this.y = tScale(this.startdate);
          }
          else if (this.startdate < current_min) { // if it happened earlier, put it on top. TODO: make it note somewhere that it is further up, so that it can look different
            this.y = Math.floor(rectH/2);
          }
          else if (this.startdate > current_max){
            console.log(this.abbr + ", far down");
          }
        
        if (updatex){
            if (i == undefined){
                console.log("abc");
                this.x = (this.position + 1) * rectW;
            }
            else{
                this.x = (i+1) * rectW;
            }

            this.events.forEach(element => element.x = this.x);
        }
    }

    importAttacks(passed_data){
        passed_data.attacks.forEach(element => this.events.push(new mmp_event( 
            element.attack.item_id, "Major Attack", element.attack.field_description, 
            parseTime(element.attack.field_date.substr(0,10)), this.id, 0, 0
        )));
    }

    // this method is used to collect all of the pertinent information for a group to redraw the map with only these groups/events/relationships
    buildTraceDataset(){

        // create empty dataset
        var tracedataset = {
            mmp_groups: {},
            relationships: []
        };

        // add itself to the tracedataset
        tracedataset.mmp_groups[this.id] = this;

        // because links.groups is a Set, this is used to convert it back to an array for easy iteration
        let linkedgroups = [...this.links.groups];

        // put all relavent groups into tracedataset from their ids
        for(i=0;i<linkedgroups.length; i++){
            let linkedgroupid = linkedgroups[i];

            tracedataset.mmp_groups[linkedgroupid] = processed_data.mmp_groups[linkedgroupid];
        };

        // creating an array because 'this' causes weird issues when calling many nested methods
        let linkedrelationships = this.links.relationships;

        // add all relavent relationships from their ids
        tracedataset.relationships = processed_data.relationships.filter(element => linkedrelationships.includes(element.id));

        // return the complete dataset, to be used in redrawing the map
        return tracedataset;
    }
}

class mmp_event {
    constructor(id, name, description, date, parent_id, x, y) {
        this.id = id;
        //this.type = type;
        this.name = name;
        this.description = description;
        this.date = date;
        this.parent_id = parent_id;
        this.traced = true;
        this.x = x;
        this.y = y;
    }

    updatePos(){
        // y position
        this.y = tScale(this.date); // + this.y
    }
}

class mmp_relationship {
    constructor(relationship_type, id, date, description, group1, group2) {
        this.relationship_type = relationship_type;
        this.id = id;
        this.date = date;
        this.description = description;
        this.group1 = group1;
        this.group2 = group2;
        this.traced = true;

        this.x1 = 0;
        this.x2 = 0;
        this.y = 0;
    }

    // updateAdjoiningGroups updates the links object under mmpgroups to create arrays representing which groups are connected and by which relationships
    updateAdjoiningGroups(){
        // since current data(June 1st 2022) has an issue with group_ids not actually in this map
        try{
            //
            // while a little bit clunky, repeating the code for group2 avoids conflicting "this" calls
            processed_data.mmp_groups[this.group1].links.relationships.push(this.id);
            processed_data.mmp_groups[this.group2].links.relationships.push(this.id);

            // while relationship ids wont repeat, group ids will. Need to make sure this array doesn't contain duplicates
            // in order to do that, processed_data...links.groups is a Set :) set theory finally will be useful!
            processed_data.mmp_groups[this.group2].links.groups.add(this.group1);
            processed_data.mmp_groups[this.group1].links.groups.add(this.group2);
        }
        catch(e){}
    }

    updatePos(){
        this.y = tScale(this.date);
        try{
            this.x1 = processed_data.mmp_groups[this.group1].x;
            this.x2 = processed_data.mmp_groups[this.group2].x;
        }
        catch{}
    }
}