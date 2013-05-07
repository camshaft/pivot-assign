var should = require("should")
  , assign = require("..")({silent: true});

describe("pivot-assign", function() {

  var config = {
    name: 'group-test',
    enabled: true,
    control: 'blue',
    target: 'red',
    variants: ["red", "blue", "green"],
    groups: [
      {value: "red", users: ["tim", "cameron"]},
      {value: "blue", users: ["nic"]},
      {value: "green", users: ["scott"]}
    ]
  };

  it("should return the target for a deprecated feature", function(done){
    assign({name: 'true-test', deprecated: true, target: true}, {}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.be.true;
      done();
    });
  });

  it("should return the control for a disabled feature", function(done){
    assign({name: 'false-test', enabled: false, control: false}, {}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.be.false;
      done();
    });
  });

  it("should assign a user to a group", function(done) {
    assign(config, {id: "cameron"}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.eql("red");
      done();
    });
  });

  it("should assign a user to a group that's not first", function(done) {
    assign(config, {id: "scott"}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.eql("green");
      done();
    });
  });

  it("should assign a user to the control group if not present in others", function(done) {
    assign(config, {}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.eql("blue");
      done();
    });
  });

  it("should assign a user to a weight range", function(done){
    var config = {
      name: 'weight-test',
      enabled: true,
      control: 'red',
      target: 'green',
      variants: ["red", "blue", "green"],
      groups: [
        {value: "red", weight: 0},
        {value: "blue", weight: 1},
        {value: "green", weight: 0}
      ]
    };

    assign(config, {id: "joe"}, function(err, variant) {
      if(err) return done(err);
      should.exist(variant);
      variant.should.eql("blue");
      done();
    });
  });

});
