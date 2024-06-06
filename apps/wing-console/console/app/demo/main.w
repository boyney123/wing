bring sim;
bring util;

inflight class Resource impl sim.IResource {
  pub onStop() {}
}

let parent1 = new sim.Resource(inflight () => {
  return new Resource();
}) as "Parent1";

let errorResource = new sim.Resource(inflight () => {
  util.sleep(3s);
  throw "oops";
}) as "ErrorResource" in parent1;

class OkResource {
  inflight new () {
    log(unsafeCast(errorResource.call("hi")));
  }
}

// let parentErrorResource = new OkResource() as "ParentResource";

let parentResource = new OkResource() as "ParentResource";

let okResource = new OkResource() in parentResource;

inflight class SlowResource impl sim.IResource {
  new () {
    util.sleep(5s);
  }

  pub onStop() {}
}

let slowResource = new sim.Resource(inflight () => {
  return new SlowResource();
}) as "SlowResource";

new sim.Resource(inflight () => {
  while true {
    util.sleep(5s);
  }
  throw "never";
}) as "NeverEndingResource";
