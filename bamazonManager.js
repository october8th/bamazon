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
  showMenu();//list the manager menu options
});

function viewProducts() 
{//showing all products for sale
  console.log("Selecting all products...\n");
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);
    //for each item in my list - show me the price
    let config,data,output;
    var testing = [["Product ID","Name","Price","Stock","Department"]];
    for (var i = 0; i < res.length; i++) 
    {
      testing.push([res[i].item_id,res[i].product_name,res[i].price.toFixed(2),res[i].stock,res[i].department_name]);
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
            alignment: 'left',
            minWidth: 10
        },
        3: 
        {
            alignment: 'left',
            minWidth: 10
        },
        4: 
        {
            alignment: 'left',
            minWidth: 10
        }
      },
      drawHorizontalLine: (index, size) => {
          return index === 0 || index === 1 || index === size;
      }
    };
    output = table(data, config);
    console.log(output);
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
      console.log(name + " added.");
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
      let config,data,output;
      var testing = [["Product ID","Name","Price","Stock","Department"]];
      for (var i = 0; i < res.length; i++) 
      {
        testing.push([res[i].item_id,res[i].product_name,res[i].price.toFixed(2),res[i].stock,res[i].department_name]);
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
              alignment: 'left',
              minWidth: 10
          },
          3: 
          {
              alignment: 'left',
              minWidth: 10
          },
          4: 
          {
              alignment: 'left',
              minWidth: 10
          }
        },
        drawHorizontalLine: (index, size) => {
            return index === 0 || index === 1 || index === size;
        }
      };
      output = table(data, config);
      console.log(output);
    }
    showMenu();
  });
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