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
  showMenu();//list the manager menu options
});

function createProduct() 
{
  console.log("Inserting a new product...\n");
  var query = connection.query(
    "INSERT INTO products SET ?",
    {
      flavor: "Rocky Road",
      price: 3.0,
      quantity: 50
    },
    function(err, res) 
    {
      console.log(res.affectedRows + " product inserted!\n");
    }
  );

  // logs the actual query being run
  console.log(query.sql);
}

function updateProduct() 
{
  console.log("Updating all Rocky Road quantities...\n");
  var query = connection.query(
    "UPDATE products SET ? WHERE ?",
    [
      {
        flavor: "Chocolate",
        price: 100,
        quantity: 25
      },
      {
        id: 1
      }
    ],
    function(err, res) 
    {
      console.log(res.affectedRows + " products updated!\n");
    }
  );

  // logs the actual query being run
  console.log(query.sql);
}

function deleteProduct() 
{
  console.log("Deleting all strawberry icecream...\n");
  connection.query(
    "DELETE FROM products WHERE ?",
    {
      flavor: "strawberry"
    },
    function(err, res) 
    {
      console.log(res.affectedRows + " products deleted!\n");
    }
  );
}

function viewProducts() 
{//showing all products for sale
  console.log("Selecting all products...\n");
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    res.forEach(printItem);
    showMenu();
  });
}

function addMoreInventory(item,quantity)
{
  console.log("Adding  " + quantity + " x Item ID: " + item);
  connection.query(
    "UPDATE products SET stock = stock + ? WHERE ?",
    [
      quantity,
      {
        item_id: item
      }
    ],
    function(err, res) 
    {
      showMenu();
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
      addMoreInventory(item,quantity);
    }
    else//we don't have that many.  let's try again?
    {
      console.log("That's not a valid item. Please choose a valid Item ID.");
      addInventory();
    }
  });
}

function addMoreProduct(name,department,price,stock)
{
  connection.query(
    "INSERT INTO products SET ?",
    {
      product_name: name,
      price: price,
      stock: stock,
      department_name:department
    },
    function(err, res) 
    {
      if (err) throw err;
      console.log(name + "added.");
      showMenu();
    });
 }


function addProduct()
{
  var product_name = " ";
  var product_department = " ";
  var product_price = 0;
  var product_stock = 0;
  inquirer.prompt([
  {
    type: "input",
    name: "name",
    message: "Enter a name for the new product. Type 0 for the main menu."
  }
  ]).then(function(answer) 
  {
    product_name = answer.name;
    if(product_name == 0)
    {
      showMenu();
    }
    else
    {
      inquirer.prompt([
      {
        type: "input",
        name: "department",
        message: "Enter a department for the new product. Type 0 for the main menu."
      }
      ]).then(function(answer) 
      {
        product_department = answer.department;
        if(product_department == 0)
        {
          showMenu();
        }
        else
        {
          inquirer.prompt([
          {
            type: "input",
            name: "price",
            message: "What is the price? Type 0 for the main menu.",
            validate: function(aNumber)
            {
              if(aNumber.match(/^\s*-?(\d+(\.\d{1,2})?|\.\d{1,2})\s*$/))//is it a decimal up to 4 places?
              {
                return true;
              }
              else
              return "Please enter an item price ex: 34.55";//we are totally not cool 
            }
          }
          ]).then(function(answer) 
          {
            product_price = answer.price;
            if(product_price == 0)
            {
              showMenu();
            }
            else
            {
              inquirer.prompt([
              {
                type: "input",
                name: "stock",
                message: "How many are in stock? Type 0 for the main menu.",
                validate: function(aNumber)
                {
                  if(aNumber.match(/^\d+$/))//is it even a number?
                  {
                    return true;
                  }
                  else
                  return "Please type an integer";//we are totally not cool 
                }
              }
              ]).then(function(answer) 
              {
                product_stock = answer.stock;
                if(product_price == 0)
                {
                  showMenu();
                }
                else
                {
                  addMoreProduct(product_name,product_department,product_price,product_stock)
                }
              });
            }
          });
        }
      });
    }
  });
}



function addInventory()
{
  var itemId = 0;
  var itemQuantity = 0;
  inquirer.prompt([
  {
    type: "input",
    name: "whatID",
    message: "What product ID would you like to add inventory to? Type 0 for the main menu.",
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
      showMenu();
    }
    else
    {
      inquirer.prompt([
      {
        type: "input",
        name: "howMany",
        message: "How many would you like to add? Type 0 for the main menu.",
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
          showMenu();
        }
        else
        {
          checkItem(itemId, itemQuantity);
        }
      });
    }
  });
}






function ViewLow(quantity)
{
  connection.query("SELECT * FROM products WHERE stock < ?",quantity, function(err, res) 
  {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    //console.log(res[0]);
    //console.log(parseInt(res[0].stock));
    if(res.length == 0)
    {
      console.log("No items are low");
    }
    else
    {
      console.log("The following items are low");
      res.forEach(printItem);
    }
    showMenu();
  });
}

function printItem(item,index)
{//give me the id, name and price and show it pretty
  if(item.product_name.length > 15)
  {
    console.log("ID: " + item.item_id + "\t" + item.product_name + "\t" + item.price + "\t" + " Stock: " + item.stock + "\t" + "Department: " + item.department_name);
  }
  else
  {
    console.log("ID: " + item.item_id + "\t" + item.product_name + "\t\t" + item.price + "\t" + " Stock: " + item.stock + "\t" +"Department: " + item.department_name);
  }
}


function showMenu()//display the manager options
{
  inquirer.prompt([
  {
    type: "list",
    message: "Welcome manager.  What would you like to do?",
    choices: ["View_Products", "View_Low_Inventory", "Add_to_Inventory", "Add_New_Product","Quit"],
    name: "menuChoice"
  }
  ])
  .then(function(answer) 
  {
    //which option did thay choose?
    switch(answer.menuChoice) //which command did i pick?
    {//call the chosen command
      case "View_Products":
        viewProducts();
          break;
      case "View_Low_Inventory":
        ViewLow(5);
          break;
      case "Add_to_Inventory":
        addInventory();
          break;
      case "Add_New_Product":
        addProduct();
          break;
      case "Quit":
        connection.end();
        return;
    }
  });
}