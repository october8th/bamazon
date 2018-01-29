//use mysql to interact with the mysql database i've created
var mysql = require("mysql");
//use inquirer to prompt for input and give output
var inquirer = require("inquirer");
//create a connection to the database
var connection = mysql.createConnection(
{//connection details
  host: "localhost",
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "password1",
  database: "bamazonDB"
});

//connect and throw an error if there is one
connection.connect(function(err) 
{
  if (err) throw err;
  console.log("connected as id " + connection.threadId + "\n");
  readProducts();//list the products for sale
});

function readProducts() 
{//showing all products for sale
  console.log("Selecting all products...\n");
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    res.forEach(printItem);
    takeOrder();
  });
}

function placeOrder(item,quantityLeft,bought)
{
  console.log("Placing your order for " + bought + " x Item ID: " + item);
  console.log("There is now  " + quantityLeft + " x Item ID: " + item + " left.");
  connection.query(
    "UPDATE products SET ? WHERE ?",
    [
      {
        stock: quantityLeft
      },
      {
        item_id: item
      }
    ],
    function(err, res) 
    {
      checkOut(item,bought)
    }
  );
}

function checkOut(item,bought)
{
  var myPrice = 0;
  connection.query("SELECT * FROM products WHERE item_id = ?",item, function(err, res) 
  {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    //console.log(res[0]);
    //console.log(parseInt(res[0].stock));
    myPrice = res[0].price;
    console.log("Your total is $" + (myPrice * bought).toFixed(2));
    takeOrder();
  });
}



function checkStock(item,quantity)
{
  var myQuantity = 0;
  connection.query("SELECT * FROM products WHERE item_id = ?",item, function(err, res) 
  {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    //console.log(res[0]);
    //console.log(parseInt(res[0].stock));
    myQuantity = res[0].stock;
    if(myQuantity >= quantity)//if the item is in stock, make the sale
    {
      placeOrder(item,myQuantity - quantity,quantity);
    }
    else//we don't have that many.  let's try again?
    {
      console.log("I'm sorry, we only have " + myQuantity + " of those.");
      takeOrder();
    }
  });
}

function checkItem(item,quantity)
{
  connection.query("SELECT * FROM products WHERE item_id = ?",item, function(err, res) 
  {
    if (err) throw err;
    if(res.length > 0)//if the item is in stock, make the sale
    {
      //console.log("that's a valid item");
      checkStock(item,quantity);
    }
    else//we don't have that many.  let's try again?
    {
      console.log("That's not a valid item. Please choose a valid Item ID.");
      takeOrder();
    }
  });
}

function printItem(item,index)
{//give me the id, name and price and show it pretty
  if(item.product_name.length > 15)
  {
    console.log("ID: " + item.item_id + "\t" + item.product_name + "\t" + item.price);
  }
  else
  {
    console.log("ID: " + item.item_id + "\t" + item.product_name + "\t\t" + item.price);
  }
}


function takeOrder()//fill in player object(s)
{
  var itemId = 0;
  var itemQuantity = 0;
  inquirer.prompt([
  {
    type: "input",
    name: "whatID",
    message: "What product ID would you like? Type 0 to quit.",
    validate: function(aNumber)
    {
      if(aNumber.match(/^\d+$/))//is it even a number?
      {
        return true;
      }
      else
      return "Please type a product ID Number";//we are totally not cool 
    }
  }
  ]).then(function(answer) 
  {
    itemId = answer.whatID;
    if(itemId == 0)
    {
      connection.end();
      return;
    }
    else
    {
      inquirer.prompt([
      {
        type: "input",
        name: "howMany",
        message: "How many would you like? Type 0 to quit.",
        validate: function(aNumber)
        {
          if(aNumber.match(/^\d+$/))//is it even a number?
          {
            return true;
          }
          else
          return "Please enter a Number - How many would you like?";//we are totally not cool 
        }
      }
      ]).then(function(answer) 
      {
        itemQuantity = answer.howMany;
        if(itemQuantity == 0)
        {
          connection.end();
          return;
        }
        else
        {
          checkItem(itemId, itemQuantity);
        }
      });
    }
  });
}