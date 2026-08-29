// =====================================================
// KORUXA MARKET
//
// Gems automatically require 6 matching Ore.
//
// Effective Ore Quantity =
// MAX(
//   Ore manually ordered,
//   Gems ordered × 6
// )
//
// Example:
//
// Manual Ore = 4
// Gems = 1
//
// Required Ore = 6
// Basket displays 6 Ore.
//
// Only 2 Ore were automatically added.
// =====================================================


const ORE_PER_GEM = 6;


// =====================================================
// CLOUDFLARE WORKER
//
// Paste your Worker URL here once deployed.
//
// Example:
// https://koruxa-market-orders.username.workers.dev
// =====================================================

const ORDER_ENDPOINT = "";


// =====================================================
// MARKET DATA
// =====================================================

const MATERIALS = [

  {
    name: "Dustite",
    orePrice: 1000,
    gemName: "Opal",
    gemPrice: 25000
  },

  {
    name: "Void Rift",
    orePrice: 350,
    gemName: null,
    gemPrice: null
  },

  {
    name: "Gold",
    orePrice: 1500,
    gemName: null,
    gemPrice: null
  },

  {
    name: "Copite",
    orePrice: 550,
    gemName: "Amber",
    gemPrice: 27000
  },

  {
    name: "Velorite",
    orePrice: 650,
    gemName: "Aquastone",
    gemPrice: 29000
  },

  {
    name: "Crimsite",
    orePrice: 750,
    gemName: "Garnet",
    gemPrice: 31500
  },

  {
    name: "Shalore",
    orePrice: 850,
    gemName: "Frostgem",
    gemPrice: 33500
  },

  {
    name: "Noctite",
    orePrice: 950,
    gemName: "Voidopal",
    gemPrice: 35500
  },

  {
    name: "Auorite",
    orePrice: 1050,
    gemName: "Sunstone",
    gemPrice: 37500
  },

  {
    name: "Vexite",
    orePrice: 1150,
    gemName: "Duskgem",
    gemPrice: 39500
  },

  {
    name: "Zephyne",
    orePrice: 1250,
    gemName: "Stormheart",
    gemPrice: 41500
  },

  {
    name: "Korunite",
    orePrice: 1350,
    gemName: "Astralite",
    gemPrice: 44000
  },

  {
    name: "Drakonite",
    orePrice: 1450,
    gemName: "Emberstone",
    gemPrice: 46000
  },

  {
    name: "Potent Void Rift",
    orePrice: 350,
    gemName: null,
    gemPrice: null
  },

  {
    name: "Pyrethium",
    orePrice: 1550,
    gemName: "Magmaheart",
    gemPrice: 48000
  },

  {
    name: "Infernite",
    orePrice: 1650,
    gemName: "Pyreshard",
    gemPrice: 50000
  }

];


// =====================================================
// STATE
//
// cart:
// {
//   Dustite: {
//     manualOre: 4,
//     gems: 1
//   }
// }
//
// The displayed Ore becomes MAX(4, 6) = 6.
// =====================================================

const state = {

  cart: {},

  search: ""

};


// =====================================================
// ELEMENTS
// =====================================================

const materialList =
  document.querySelector(
    "#materialList"
  );

const materialTemplate =
  document.querySelector(
    "#materialTemplate"
  );

const searchInput =
  document.querySelector(
    "#search"
  );

const cartItems =
  document.querySelector(
    "#cartItems"
  );

const grandTotal =
  document.querySelector(
    "#grandTotal"
  );

const cartCount =
  document.querySelector(
    "#cartCount"
  );

const topBasketCount =
  document.querySelector(
    "#topBasketCount"
  );

const validationMessage =
  document.querySelector(
    "#validationMessage"
  );

const customerName =
  document.querySelector(
    "#customerName"
  );

const orderNotes =
  document.querySelector(
    "#orderNotes"
  );

const submitOrderButton =
  document.querySelector(
    "#submitOrder"
  );

const submitStatus =
  document.querySelector(
    "#submitStatus"
  );

const clearOrderButton =
  document.querySelector(
    "#clearOrder"
  );


// =====================================================
// FORMAT
// =====================================================

function gp(value) {

  return (
    Number(value).toLocaleString() +
    " GP"
  );

}


// =====================================================
// MATERIAL LOOKUP
// =====================================================

function getMaterial(name) {

  return MATERIALS.find(
    material =>
      material.name === name
  );

}


// =====================================================
// CART ENTRY
// =====================================================

function getEntry(materialName) {

  if (!state.cart[materialName]) {

    state.cart[materialName] = {

      manualOre: 0,

      gems: 0

    };

  }

  return state.cart[materialName];

}


// =====================================================
// REQUIRED ORE
// =====================================================

function getRequiredOre(materialName) {

  const entry =
    getEntry(materialName);

  return (
    entry.gems *
    ORE_PER_GEM
  );

}


// =====================================================
// EFFECTIVE ORE
//
// This is the important part.
//
// If manually ordered Ore is already enough,
// NOTHING extra is added.
//
// Otherwise, only the missing Ore is automatically
// included.
// =====================================================

function getEffectiveOre(materialName) {

  const entry =
    getEntry(materialName);

  const requiredOre =
    getRequiredOre(
      materialName
    );

  return Math.max(

    entry.manualOre,

    requiredOre

  );

}


// =====================================================
// AUTOMATIC ORE AMOUNT
// =====================================================

function getAutomaticOre(materialName) {

  const entry =
    getEntry(materialName);

  const effective =
    getEffectiveOre(
      materialName
    );

  return Math.max(

    0,

    effective -
    entry.manualOre

  );

}


// =====================================================
// CLEAN EMPTY CART ENTRIES
// =====================================================

function cleanupCart() {

  Object.keys(
    state.cart
  ).forEach(name => {

    const entry =
      state.cart[name];

    if (
      entry.manualOre <= 0 &&
      entry.gems <= 0
    ) {

      delete state.cart[name];

    }

  });

}


// =====================================================
// SAVE
// =====================================================

function saveCart() {

  localStorage.setItem(

    "koruxaMarketCart",

    JSON.stringify(
      state.cart
    )

  );

}


// =====================================================
// TOTAL ITEM COUNT
// =====================================================

function getTotalItemCount() {

  let total = 0;

  Object.keys(
    state.cart
  ).forEach(name => {

    const entry =
      state.cart[name];

    total +=
      getEffectiveOre(name);

    total +=
      entry.gems;

  });

  return total;

}


// =====================================================
// TOTAL PRICE
// =====================================================

function calculateGrandTotal() {

  let total = 0;

  Object.keys(
    state.cart
  ).forEach(name => {

    const material =
      getMaterial(name);

    if (!material) {
      return;
    }

    const entry =
      state.cart[name];

    const oreQty =
      getEffectiveOre(name);

    total +=
      oreQty *
      material.orePrice;

    if (
      entry.gems > 0 &&
      material.gemPrice != null
    ) {

      total +=
        entry.gems *
        material.gemPrice;

    }

  });

  return total;

}


// =====================================================
// RENDER MATERIALS
// =====================================================

function renderMaterials() {

  materialList.innerHTML = "";

  const query =
    state.search
      .trim()
      .toLowerCase();


  const materials =
    MATERIALS.filter(
      material => {

        const searchable =
          [
            material.name,
            material.gemName || ""
          ]
            .join(" ")
            .toLowerCase();

        return searchable.includes(
          query
        );

      }
    );


  if (!materials.length) {

    materialList.innerHTML = `

      <div class="no-results">

        No materials match
        "<strong>${state.search}</strong>"

      </div>

    `;

    return;

  }


  materials.forEach(
    material => {

      const fragment =
        materialTemplate
          .content
          .cloneNode(true);


      const card =
        fragment.querySelector(
          ".material-card"
        );

      const visualIcon =
        fragment.querySelector(
          ".visual-icon"
        );

      const category =
        fragment.querySelector(
          ".material-category"
        );

      const title =
        fragment.querySelector(
          "h3"
        );

      const secondary =
        fragment.querySelector(
          ".material-secondary"
        );

      const oreButton =
        fragment.querySelector(
          ".ore-button"
        );

      const gemButton =
        fragment.querySelector(
          ".gem-button"
        );

      const gemButtonName =
        fragment.querySelector(
          ".gem-button-name"
        );

      const unitPriceElement =
        fragment.querySelector(
          ".unit-price"
        );

      const requirementInfo =
        fragment.querySelector(
          ".requirement-info"
        );

      const qtyInput =
        fragment.querySelector(
          ".qty-input"
        );

      const lineTotal =
        fragment.querySelector(
          ".line-total"
        );

      const addButton =
        fragment.querySelector(
          ".add-button"
        );


      let selectedType =
        "ore";


      if (
        material.gemName
      ) {

        gemButtonName.textContent =
          material.gemName;

      } else {

        gemButtonName.textContent =
          "No Gem";

        gemButton.disabled =
          true;

      }


      // =================================================
      // SELECT TYPE
      // =================================================

      function updateTypeDisplay() {

        card.classList.toggle(

          "gem-selected",

          selectedType === "gem"

        );


        if (
          selectedType === "ore"
        ) {

          visualIcon.textContent =
            "⛏️";

          category.textContent =
            "ORE";

          title.textContent =
            material.name;

          secondary.textContent =
            material.gemName
              ? `Matching gem: ${material.gemName}`
              : "Ore only";

          unitPriceElement.textContent =
            gp(
              material.orePrice
            );

          requirementInfo.innerHTML =
            `Mine-ready material`;

        }


        if (
          selectedType === "gem"
        ) {

          visualIcon.textContent =
            "💎";

          category.textContent =
            "UNCUT GEM";

          title.textContent =
            material.gemName;

          secondary.textContent =
            `Matched with ${material.name} Ore`;

          unitPriceElement.textContent =
            gp(
              material.gemPrice
            );


          const entry =
            getEntry(
              material.name
            );

          const currentOre =
            getEffectiveOre(
              material.name
            );


          requirementInfo.innerHTML = `

            <strong>
              6 Ore / Gem
            </strong>

            <br>

            ${currentOre.toLocaleString()}
            Ore currently in basket

          `;

        }


        oreButton.classList.toggle(

          "active",

          selectedType === "ore"

        );


        gemButton.classList.toggle(

          "active",

          selectedType === "gem"

        );


        updateLineTotal();

      }


      // =================================================
      // LINE TOTAL
      // =================================================

      function updateLineTotal() {

        let quantity =
          parseInt(
            qtyInput.value,
            10
          );


        if (
          !Number.isFinite(
            quantity
          ) ||
          quantity < 1
        ) {

          quantity = 1;

        }


        qtyInput.value =
          String(quantity);


        const price =
          selectedType === "ore"
            ? material.orePrice
            : material.gemPrice;


        lineTotal.textContent =
          gp(
            price *
            quantity
          );

      }


      // =================================================
      // ORE BUTTON
      // =================================================

      oreButton.addEventListener(

        "click",

        () => {

          selectedType =
            "ore";

          updateTypeDisplay();

        }

      );


      // =================================================
      // GEM BUTTON
      // =================================================

      gemButton.addEventListener(

        "click",

        () => {

          if (
            !material.gemName ||
            material.gemPrice == null
          ) {

            return;

          }

          selectedType =
            "gem";

          updateTypeDisplay();

        }

      );


      // =================================================
      // QUANTITY
      // =================================================

      qtyInput.addEventListener(

        "input",

        updateLineTotal

      );


      // =================================================
      // ADD
      // =================================================

      addButton.addEventListener(

        "click",

        () => {

          let quantity =
            parseInt(
              qtyInput.value,
              10
            );


          if (
            !Number.isFinite(
              quantity
            ) ||
            quantity < 1
          ) {

            quantity = 1;

          }


          const entry =
            getEntry(
              material.name
            );


          if (
            selectedType === "ore"
          ) {

            entry.manualOre +=
              quantity;

          }


          if (
            selectedType === "gem"
          ) {

            entry.gems +=
              quantity;

          }


          cleanupCart();

          saveCart();

          renderCart();

          renderMaterials();


          addButton.textContent =
            "Added ✓";

        }

      );


      updateTypeDisplay();

      materialList.appendChild(
        fragment
      );

    }
  );

}


// =====================================================
// CART ROW CREATOR
// =====================================================

function createCartRow({

  icon,

  name,

  metadata,

  note,

  quantity,

  price,

  onMinus,

  onPlus,

  onRemove

}) {

  const row =
    document.createElement(
      "div"
    );

  row.className =
    "cart-row";


  row.innerHTML = `

    <div class="cart-icon">
      ${icon}
    </div>


    <div>

      <div class="cart-name">
        ${name}
      </div>

      <div class="cart-meta">
        ${metadata}
      </div>

      ${
        note
          ? `
            <div class="auto-ore-note">
              ${note}
            </div>
          `
          : ""
      }

    </div>


    <div class="cart-right">

      <div class="cart-price">
        ${price}
      </div>


      <div class="cart-controls">

        <button
          type="button"
          class="cart-control-button minus"
        >
          −
        </button>


        <span class="cart-qty">
          ${quantity}
        </span>


        <button
          type="button"
          class="cart-control-button plus"
        >
          +
        </button>


        <button
          type="button"
          class="
            cart-control-button
            remove-cart-button
            remove
          "
          title="Remove"
        >
          ×
        </button>

      </div>

    </div>

  `;


  row
    .querySelector(
      ".minus"
    )
    .addEventListener(
      "click",
      onMinus
    );


  row
    .querySelector(
      ".plus"
    )
    .addEventListener(
      "click",
      onPlus
    );


  row
    .querySelector(
      ".remove"
    )
    .addEventListener(
      "click",
      onRemove
    );


  return row;

}


// =====================================================
// RENDER CART
// =====================================================

function renderCart() {

  cleanupCart();

  cartItems.innerHTML =
    "";


  const materialNames =
    Object.keys(
      state.cart
    );


  if (!materialNames.length) {

    cartItems.innerHTML = `

      <div class="empty-basket">

        <div class="empty-icon">
          🛒
        </div>

        <strong>
          Your basket is empty
        </strong>

        <span>
          Add some ore or gems above.
        </span>

      </div>

    `;

  }


  materialNames.forEach(
    materialName => {

      const material =
        getMaterial(
          materialName
        );


      if (!material) {
        return;
      }


      const entry =
        getEntry(
          materialName
        );


      const oreQty =
        getEffectiveOre(
          materialName
        );


      const autoOre =
        getAutomaticOre(
          materialName
        );


      // =================================================
      // ORE ROW
      // =================================================

      if (oreQty > 0) {

        let note = "";


        if (autoOre > 0) {

          note =
            `${autoOre.toLocaleString()} Ore automatically added for your gem order`;

        }


        const oreRow =
          createCartRow({

            icon:
              "⛏️",

            name:
              `${material.name} Ore`,

            metadata:
              `${oreQty.toLocaleString()} × ${gp(material.orePrice)}`,

            note,

            quantity:
              oreQty.toLocaleString(),

            price:
              gp(
                oreQty *
                material.orePrice
              ),


            // -------------------------------------------
            // MINUS ORE
            //
            // Only manual Ore can actually be removed.
            // Required Ore for Gems stays.
            // -------------------------------------------

            onMinus() {

              if (
                entry.manualOre > 0
              ) {

                entry.manualOre--;

              }

              cleanupCart();

              saveCart();

              renderCart();

              renderMaterials();

            },


            // -------------------------------------------
            // PLUS ORE
            // -------------------------------------------

            onPlus() {

              // If current displayed Ore is automatic,
              // adding +1 means the buyer now wants
              // one more than the displayed amount.

              entry.manualOre =
                Math.max(

                  entry.manualOre,

                  oreQty

                ) + 1;


              saveCart();

              renderCart();

              renderMaterials();

            },


            // -------------------------------------------
            // REMOVE ORE
            // -------------------------------------------

            onRemove() {

              entry.manualOre = 0;


              // Required Ore remains automatically
              // if Gems are still ordered.

              cleanupCart();

              saveCart();

              renderCart();

              renderMaterials();

            }

          });


        cartItems.appendChild(
          oreRow
        );

      }


      // =================================================
      // GEM ROW
      // =================================================

      if (
        entry.gems > 0 &&
        material.gemName
      ) {

        const gemRow =
          createCartRow({

            icon:
              "💎",

            name:
              `${material.gemName} (Uncut Gem)`,

            metadata:
              `${entry.gems.toLocaleString()} × ${gp(material.gemPrice)}`,

            note:
              `Requires ${(entry.gems * ORE_PER_GEM).toLocaleString()} ${material.name} Ore`,

            quantity:
              entry.gems.toLocaleString(),

            price:
              gp(
                entry.gems *
                material.gemPrice
              ),


            // -------------------------------------------
            // MINUS GEM
            // -------------------------------------------

            onMinus() {

              entry.gems =
                Math.max(
                  0,
                  entry.gems - 1
                );


              cleanupCart();

              saveCart();

              renderCart();

              renderMaterials();

            },


            // -------------------------------------------
            // PLUS GEM
            // -------------------------------------------

            onPlus() {

              entry.gems++;


              saveCart();

              renderCart();

              renderMaterials();

            },


            // -------------------------------------------
            // REMOVE GEM
            // -------------------------------------------

            onRemove() {

              entry.gems = 0;


              cleanupCart();

              saveCart();

              renderCart();

              renderMaterials();

            }

          });


        cartItems.appendChild(
          gemRow
        );

      }

    }
  );


  // =================================================
  // TOTAL
  // =================================================

  const totalItems =
    getTotalItemCount();


  cartCount.textContent =
    totalItems.toLocaleString();


  topBasketCount.textContent =
    totalItems.toLocaleString();


  grandTotal.textContent =
    gp(
      calculateGrandTotal()
    );


  // =================================================
  // AUTOMATIC ORE MESSAGE
  // =================================================

  const totalAutoOre =
    Object.keys(
      state.cart
    )
      .reduce(
        (sum, name) => {

          return (
            sum +
            getAutomaticOre(name)
          );

        },
        0
      );


  if (totalAutoOre > 0) {

    validationMessage.textContent =
      `✓ ${totalAutoOre.toLocaleString()} required Ore automatically included for Gem purchases.`;

  } else {

    validationMessage.textContent =
      "";

  }

}


// =====================================================
// BUILD FINAL ORDER
// =====================================================

function buildOrder() {

  const items = [];


  Object.keys(
    state.cart
  ).forEach(
    materialName => {

      const material =
        getMaterial(
          materialName
        );


      if (!material) {
        return;
      }


      const entry =
        getEntry(
          materialName
        );


      const oreQty =
        getEffectiveOre(
          materialName
        );


      if (oreQty > 0) {

        items.push({

          material:
            materialName,

          itemName:
            `${materialName} Ore`,

          type:
            "ore",

          quantity:
            oreQty,

          unitPrice:
            material.orePrice,

          total:
            oreQty *
            material.orePrice,

          automaticOre:
            getAutomaticOre(
              materialName
            )

        });

      }


      if (
        entry.gems > 0 &&
        material.gemName
      ) {

        items.push({

          material:
            materialName,

          itemName:
            material.gemName,

          type:
            "gem",

          quantity:
            entry.gems,

          unitPrice:
            material.gemPrice,

          total:
            entry.gems *
            material.gemPrice

        });

      }

    }
  );


  return {

    customerName:
      customerName
        .value
        .trim(),

    notes:
      orderNotes
        .value
        .trim(),

    items,

    total:
      calculateGrandTotal(),

    submittedAt:
      new Date()
        .toISOString()

  };

}


// =====================================================
// SEARCH
// =====================================================

searchInput.addEventListener(

  "input",

  event => {

    state.search =
      event.target.value;

    renderMaterials();

  }

);


// =====================================================
// CUSTOMER STORAGE
// =====================================================

customerName.addEventListener(

  "input",

  () => {

    localStorage.setItem(

      "koruxaCustomerName",

      customerName.value

    );

  }

);


orderNotes.addEventListener(

  "input",

  () => {

    localStorage.setItem(

      "koruxaOrderNotes",

      orderNotes.value

    );

  }

);


// =====================================================
// CLEAR BASKET
// =====================================================

clearOrderButton.addEventListener(

  "click",

  () => {

    if (
      !Object.keys(
        state.cart
      ).length
    ) {

      return;

    }


    const confirmed =
      confirm(
        "Clear your entire basket?"
      );


    if (!confirmed) {
      return;
    }


    state.cart = {};


    saveCart();

    renderCart();

    renderMaterials();


    submitStatus.textContent =
      "";

  }

);


// =====================================================
// SUBMIT ORDER
// =====================================================

submitOrderButton.addEventListener(

  "click",

  async () => {

    submitStatus.className =
      "submit-status";

    submitStatus.textContent =
      "";


    cleanupCart();


    // -----------------------------------------------
    // EMPTY
    // -----------------------------------------------

    if (
      !Object.keys(
        state.cart
      ).length
    ) {

      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        "Your basket is empty.";

      return;

    }


    // -----------------------------------------------
    // NAME REQUIRED
    // -----------------------------------------------

    if (
      !customerName
        .value
        .trim()
    ) {

      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        "Please enter your Discord or game name.";

      customerName.focus();

      return;

    }


    // -----------------------------------------------
    // ENDPOINT NOT SET
    // -----------------------------------------------

    if (!ORDER_ENDPOINT) {

      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        "Your market is ready, but the Cloudflare Worker URL still needs to be added to script.js.";

      return;

    }


    const order =
      buildOrder();


    submitOrderButton.disabled =
      true;


    submitOrderButton
      .querySelector(
        "span:first-child"
      )
      .textContent =
        "Submitting...";


    try {

      const response =
        await fetch(

          ORDER_ENDPOINT,

          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify(
                order
              )

          }

        );


      const result =
        await response.json()
          .catch(
            () => ({})
          );


      if (!response.ok) {

        throw new Error(

          result.error ||
          "Order submission failed."

        );

      }


      submitStatus.className =
        "submit-status success";


      submitStatus.textContent =
        "✓ Your order was submitted successfully!";


      state.cart = {};


      orderNotes.value =
        "";


      localStorage.removeItem(
        "koruxaOrderNotes"
      );


      saveCart();

      renderCart();

      renderMaterials();


      submitOrderButton
        .querySelector(
          "span:first-child"
        )
        .textContent =
          "Order Submitted ✓";


      setTimeout(
        () => {

          submitOrderButton
            .querySelector(
              "span:first-child"
            )
            .textContent =
              "Submit Order";

        },
        2500
      );

    }

    catch (error) {

      console.error(
        error
      );


      submitStatus.className =
        "submit-status error";


      submitStatus.textContent =
        error.message ||
        "Unable to submit the order.";


      submitOrderButton
        .querySelector(
          "span:first-child"
        )
        .textContent =
          "Submit Order";

    }

    finally {

      submitOrderButton.disabled =
        false;

    }

  }

);


// =====================================================
// LOAD SAVED CART
// =====================================================

try {

  const storedCart =
    JSON.parse(

      localStorage.getItem(
        "koruxaMarketCart"
      ) ||
      "{}"

    );


  if (
    storedCart &&
    typeof storedCart ===
      "object" &&
    !Array.isArray(
      storedCart
    )
  ) {

    state.cart =
      storedCart;

  }

}

catch {

  state.cart = {};

}


// =====================================================
// LOAD CUSTOMER
// =====================================================

customerName.value =
  localStorage.getItem(
    "koruxaCustomerName"
  ) || "";


orderNotes.value =
  localStorage.getItem(
    "koruxaOrderNotes"
  ) || "";


// =====================================================
// START
// =====================================================

cleanupCart();

renderMaterials();

renderCart();
