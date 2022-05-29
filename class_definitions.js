class mmp_group {
    constructor(id, name, abbr, startdate, enddate, active, x, y, description, events, links) {
        this.id = id;
        this.name = name;
        this.abbr = abbr;
        this.startdate = startdate;
        this.enddate = enddate;
        this.active = active;
        this.x = x;
        this.y = y;
        this.description = description;
        this.events = events;
        this.links = links;
    }

    updatePos(rectH){
        var current_min = tScale.domain()[0]; // finding current minimum year
        var current_max = tScale.domain()[1]; // finding current maximum year
        var rectHeight = rectHeight;
        if(this.startdate >= current_min && this.startdate <= current_max) { // inside tScale domain
            this.y = tScale(this.startdate);
          }
          else if (this.startdate < current_min) { // if it happened earlier, put it on top. TODO: make it note somewhere that it is further up, so that it can look different
            this.y = rectH/2 + 1; // add one to avoid trailing garbage error, pretty silly
          }
          else if (this.startdate > current_max){
            console.log(this.abbr + ", far down");
          }
          this.x = (i+1) * (w/(processed_data.mmp_groups.length+1));
    }

    importAttacks(){
        let this_obj = this;
        d3.json("/data/attack-profiles/" + this.id).then(function(data){
            data.attacks.forEach(element => processed_data.events.push(new mmp_event( // should push to this.events in future
                element.attack.item_id, "Major Attack", element.attack.field_description, 
                parseTime(element.attack.field_date.substr(0,10)), this_obj.id, this_obj.x, 0
            )))
        });
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
        this.x = x;
        this.y = y;
    }

    updatePos(){
        // y position
        this.y = tScale(this.date) + this.y;
    }
}

class mmp_relationship {
    constructor(relationship_type, id, date, description, group1, group2, x1, x2, y) {
        this.relationship_type = relationship_type;
        this.id = id;
        this.date = date;
        this.description = description;
        this.group1 = group1;
        this.group2 = group2;
        this.x1 = x1;
        this.x2 = x2;
        this.y = y;
    }

    updatePos(){
        this.y = tScale(this.date);
        this.x1 = processed_data.mmp_groups.find(element => this.group1 === element.id).x;
        this.x2 = processed_data.mmp_groups.find(element => this.group2 === element.id).x;
    }
}