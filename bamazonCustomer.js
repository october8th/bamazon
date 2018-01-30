//use mysql to interact with the mysql database i've created
var mysql = require("mysql");
//use inquirer to prompt for input and give output
var inquirer = require("inquirer");
//let's make pretty tables
const {table} = require('table');
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
  //console.log("connected as id " + connection.threadId + "\n");
  readProducts();//list the products for sale
});

function readProducts() 
{//showing all products for sale
  //console.log("Selecting all products...\n");
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    let config,data,output;
    var testing = [["Item ID","Name","Price"]];
    for (var i = 0; i < res.length; i++) 
    {
      testing.push([res[i].item_id,res[i].product_name,res[i].price.toFixed(2)]);
    }
    data = testing;
    config = 
    {
      columns: 
      {
        0: 
        {
            alignment: 'left',
            minWidth: 10
        },
        1: 
        {
            alignment: 'left',
            minWidth: 10
        },
        2: 
        {
            alignment: 'right',
            minWidth: 10
        }
      },
      drawHorizontalLine: (index, size) => {
          return index === 0 || index === 1 || index === size;
      }
    };
    output = table(data, config);
    console.log(output);
    takeOrder();
  });
}

function placeOrder(item,quantityLeft,bought)
{
  console.log("Placing your order for " + bought + " x Item ID: " + item);
  console.log("Stock for Item ID: " + item + " is now: " + quantityLeft);
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
    addToSales(item,myPrice * bought);
  });
}

function addToSales(item,sale)
{
  console.log("Adding  a " + sale.toFixed(2) + " sale for Item ID: " + item);
  connection.query(
    "UPDATE products SET product_sales = product_sales + ? WHERE ?",
    [
      sale,
      {
        item_id: item
      }
    ],
    function(err, res) 
    {
      if (err) throw err;
      takeOrder();
    }
  );
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