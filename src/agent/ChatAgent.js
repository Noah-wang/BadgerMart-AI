const createChatAgent = () => {
    const CS571_WITAI_ACCESS_TOKEN = "JILMXMICBCG6CB365FMG23QBZ3AYOCEP"; // Put your CLIENT access token here.

    let availableItems = [];
    let cart = [];

    const handleInitialize = async () => {
        const response = await fetch("https://cs571.org/api/s24/hw10/items", {
            headers: {
                'X-CS571-ID': 'bid_e5c17fa842e9e34246e0da9d18c22b2ea6fe5d66d8ed25f597bd150ed148f8b6'
            }
        });

        if (!response.ok) {
            return "Failed to fetch items. Please try again.";
        }
        availableItems = await response.json();
        cart = [];
        return "Welcome to BadgerMart Voice! Type your question, or ask for help if you're lost!";
    }

    const handleReceive = async (prompt) => {
        const res = await fetch("https://api.wit.ai/message?q=" + encodeURIComponent(prompt), {
            headers: {
                "Authorization": "Bearer " + CS571_WITAI_ACCESS_TOKEN
            }
        });

        if (!res.ok) {
            return "Failed to process AI. Please try again.";
        }
        const data = await res.json();

        if (data.intents.length > 0) {
            const intentName = data.intents[0].name;
            console.log(intentName);
            switch (intentName) {
                case 'get_help':
                    return "In BadgerMart Voice, you can get the list of items, the price of an item, add or remove an item from your cart, and checkout!";
                case 'items':
                    const itemNames = availableItems.map(item => item.name).join(", ");
                    return "We have the following items: " + itemNames;
                case 'add_item':
                    return handleAddItem(data);
                case 'remove_item':
                    return handleRemoveItem(data);
                case 'get_price':
                    return handleGetPrice(data);
                case 'view_cart':
                    return handleViewCart();
                case 'checkout':
                    return handleCheckout();
                default:
                    return "Sorry, I don't understand";
            }
        }

        return "Sorry, I didn't get that. Type 'help' to see what you can do!";
    }

    function handleAddItem(data) {
        const itemEntity = data.entities['item:items'] && data.entities['item:items'][0].value;
        const numberEntity = data.entities['wit$number:number'] ? Math.floor(data.entities['wit$number:number'][0].value) : 1;

        if (itemEntity) {
            const item = availableItems.find(item => item.name.toLowerCase() === itemEntity.toLowerCase());
            if (item) {
                cart.push({ name: item.name, quantity: numberEntity, price: item.price });
                return `Added ${numberEntity} ${item.name}(s) to your cart.`;
            }
        } else {
            return `This item is not in stock.`;
        }
    }

    function handleRemoveItem(data) {
        const itemEntity = data.entities['item:items'] && data.entities['item:items'][0].value;
        const numberEntity = data.entities['wit$number:number'] ? Math.floor(data.entities['wit$number:number'][0].value) : 1;
        if(numberEntity <= 0){
            return "Please input a valid number";
        }
        if (itemEntity) {
            const itemIndex = cart.findIndex(item => item.name.toLowerCase() === itemEntity.toLowerCase());
            if (itemIndex !== -1) {
                const item = cart[itemIndex];
                if (item.quantity > numberEntity) {
                    item.quantity -= numberEntity;
                } else {
                    cart.splice(itemIndex, 1);
                }
                return `Removed ${numberEntity} ${item.name}(s) from your cart.`;
            }
        } else {
            return `This item is not in stock.`;
        }
    }

    function handleGetPrice(data) {
        const itemEntity = data.entities['item:items'] && data.entities['item:items'][0].value;
        if (itemEntity) {
            const item = availableItems.find(item => item.name.toLowerCase() === itemEntity.toLowerCase());
            if (item) {
                return `${item.name} costs $${item.price}`;
            }

        } else {
            return `This item is not in stock.`;
        }
    }

    function handleViewCart() {
        if (cart.length === 0) {
            return "Your cart is empty.";
        } else {
            let message = "Your cart contains:\n";
            let total = 0;
            cart.forEach(item => {
                message += `${item.quantity} x ${item.name} at $${item.price} each\n`;
                total += item.quantity * item.price;
            });
            message += `Total Price: $${total.toFixed(2)}`;
            return message;
        }
    }

    async function handleCheckout() {
        if (cart.length === 0) {
            return "Your cart is empty. Add some items before checking out.";
        }

        const orderDetails = {};
        availableItems.forEach(item => {

            orderDetails[item.name] = 0;
        });

        cart.forEach(item => {
            orderDetails[item.name] = Math.max(0, Math.floor(item.quantity));
        });


        const totalQuantity = Object.values(orderDetails).reduce((sum, quantity) => sum + quantity, 0);
        if (totalQuantity === 0) {
            return "No items are ordered. Please add some items to your cart before checking out.";
        }

        console.log("Order details for checkout:", JSON.stringify(orderDetails));

        const response = await fetch('https://cs571.org/api/s24/hw10/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CS571-ID': 'bid_e5c17fa842e9e34246e0da9d18c22b2ea6fe5d66d8ed25f597bd150ed148f8b6',
            },
            body: JSON.stringify(orderDetails)
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error("Checkout failed:", errorResponse);
            return `Failed to process your checkout: ${errorResponse.msg}`;
        }

        const result = await response.json();
        cart = [];
        return `Checkout successful! Your confirmation ID is ${result.confirmationId}.`;
    }



    return {
        handleInitialize,
        handleReceive
    }
}

export default createChatAgent;
