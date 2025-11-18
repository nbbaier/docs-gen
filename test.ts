import ValTown from "npm:@valtown/sdk@latest";

const client = new ValTown();
const val = await client.alias.username.valName.retrieve("oauth", {
  username: "std",
});

console.log(val.id);
