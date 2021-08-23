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
}