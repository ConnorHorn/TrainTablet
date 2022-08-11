<script>

import StopButton from "./StopButton.svelte";
import Border from "./Border.svelte";
import SetPointBox from "./SetPointBox.svelte";
import StatBox from "./StatBox.svelte";
import DiagnosticsBox from "./DiagnosticsBox.svelte";
import Overrides from "./Overrides.svelte";
</script>

<Border />
<div class="mt-[548px] fixed">
<StopButton />
</div>

<div class="mt-[548px] ml-[978px] fixed">
    <StopButton />
</div>


<div class="mt-[50px] ml-[50px] fixed">
    <SetPointBox/>
</div>

<div class="mt-[380px] ml-[50px] fixed">
    <StatBox/>
</div>

<div class=" ml-[650px] mt-[30px] fixed">
<DiagnosticsBox/>
</div>

<div class=" ml-[500px] mt-[600px] fixed">
    <Overrides/>
</div>
