<script>
    import {overrideSensors} from "./stores";

    let overrideSensorsCheckBox = false;
</script>


<div class="text-4xl font-bold text-primary fixed">
    Override Sensors
</div>

<div class="ml-[120px] mt-[55px] fixed">
<input type="checkbox" bind:checked="{$overrideSensors}" class="toggle toggle-primary toggle-lg" />
</div>

