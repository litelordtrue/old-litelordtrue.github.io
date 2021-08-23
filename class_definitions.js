class group_class {
    constructor(id, name, abbr, startdate, enddate, active, x, y, description) {
        this.id = id;
        this.name = name;
        this.abbr = abbr;
        this.startdate = startdate;
        this.enddate = enddate;
        this.active = active;
        this.x = x;
        this.y = y;
        this.description = description;
    }

    updatePos(){
        if(this.startdate >= current_min && this.startdate <= current_max) { // inside tScale domain
            this.y = tScale(this.startdate);
          }
          else if (this.startdate < current_min) { // if it happened earlier, put it on top. TODO: make it note somewhere that it is further up, so that it can look different
            this.y = rectHeight/2 + 1; // add one to avoid trailing garbage error, pretty silly
          }
          else if (this.startdate > current_max){
            console.log(this.abbr + ", far down");
          }
          this.x = (i+1) * (w/(processed_data.thiss.length+1));
    }
}

class event_class {
    constructor(id, type, description, date, parent_id, x, y) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.date = date;
        this.parent_id = parent_id;
        this.x = x;
        this.y = y;
    }

    updatePos(){

    }
}

class relationship_class {
    constructor(relationship_type, date, group1, group2, x1, x2, y) {
        this.relationship_type = relationship_type;
        this.date = date;
        this.group1 = group1;
        this.group2 = group2;
        this.x1 = x1;
        this.x2 = x2;
        this.y = y;
    }

    updatePos(){

    }
}