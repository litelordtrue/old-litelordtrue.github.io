class mmp_group {
    constructor(id, name, abbr, startdate, enddate, active, description) {
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
        this.events = [];
        this.links = {relationships: [], groups: new Set()};
    }

    updatePos(rectH){
        var current_min = tScale.domain()[0]; // finding current minimum year
        var current_max = tScale.domain()[1]; // finding current maximum year
        var rectHeight = rectHeight;
        if(this.startdate >= current_min && this.startdate <= current_max) { // inside tScale domain
            this.y = tScale(this.startdate);
          }
          else if (this.startdate < current_min) { // if it happened earlier, put it on top. TODO: make it note somewhere that it is further up, so that it can look different
            this.y = Math.floor(rectH/2);
          }
          else if (this.startdate > current_max){
            console.log(this.abbr + ", far down");
          }
        this.x = (i+1) * (w/(Object.keys(processed_data.mmp_groups).length+1));
        this.events.forEach(element => element.x = this.x);
    }

    importAttacks(passed_data){
        passed_data.attacks.forEach(element => this.events.push(new mmp_event( 
            element.attack.item_id, "Major Attack", element.attack.field_description, 
            parseTime(element.attack.field_date.substr(0,10)), this.id, 0, 0
        )));
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