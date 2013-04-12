var should = require("should")
  , assign = require("..");

// Turn off alerting
assign.silent = true;

describe("pivot-assign", function(){

  it("should return true for a feature that's enabled by default", function(done){
    assign('true-test', true, {}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.be.true;
      done();
    });
  });

  it("should return false for a feature that's disabled by default", function(done){
    assign('false-test', false, {}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.be.false;
      done();
    });
  });

  it("should assign a user to a group", function(done) {

    var groups = [
      {value: "red", group: ["tim", "cameron"]},
      {value: "blue", group: ["nic"]}
    ];

    assign('group-test', groups, {id: "cameron"}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.eql("red");
      done();
    });
  });

  it("should assign a user to the default group if not present in others", function(done) {

    var groups = [
      {value: "red", group: ["tim", "cameron"]},
      {value: "blue", group: ["nic"], "default": true}
    ];

    assign('group-test', groups, {id: "joe"}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.eql("blue");
      done();
    });
  });


  it("should assign a user to a weight range", function(done){
    
    var weights = [
      {value: "red", weight: 5},
      {value: "blue", weight: 25},
      {value: "green", weight: 70}
    ];

    assign('weight-test', weights, {id: "joe"}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.eql("blue");
      done();
    });
  });

});
